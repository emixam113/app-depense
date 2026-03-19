import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushService } from './push.service';
import { User } from '../user/entity/user.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly pushService: PushService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Enregistrer le token push d'un utilisateur
  async savePushToken(userId: number, pushToken: string): Promise<void> {
    // ✅ userId en number, cohérent avec le reste de l'app
    await this.userRepository.update(userId, { pushToken });
    this.logger.log(`[Push] Token enregistré pour user ${userId}`);
  }

  // Analyser et notifier après chaque transaction
  async analyzeAndNotify(params: {
    pushToken: string;
    changeDepenses: number;
    changeRevenus: number;
    currentDepenses: number;
    currentRevenus: number;
  }): Promise<void> {
    const {
      pushToken,
      changeDepenses,
      changeRevenus,
      currentDepenses,
      currentRevenus,
    } = params;
    if (!pushToken) return;

    if (changeDepenses >= 20 && currentDepenses > 0)
      await this.pushService.notifyExpensesUp(pushToken, changeDepenses);

    if (changeRevenus <= -10 && currentRevenus > 0)
      await this.pushService.notifyRevenuesDown(pushToken, changeRevenus);

    if (changeDepenses <= -10 && currentDepenses > 0)
      await this.pushService.notifyExpensesDown(pushToken, changeDepenses);
  }

  // Alerte budget dépassé
  async checkAndNotifyBudget(params: {
    pushToken: string;
    categoryName: string;
    spent: number;
    budget: number;
  }): Promise<void> {
    const { pushToken, categoryName, spent, budget } = params;
    if (!pushToken || !budget) return;

    const pct = (spent / budget) * 100;

    if (pct >= 100)
      await this.pushService.notifyBudgetExceeded(
        pushToken,
        categoryName,
        spent,
        budget,
        100,
      );
    else if (pct >= 80)
      await this.pushService.notifyBudgetExceeded(
        pushToken,
        categoryName,
        spent,
        budget,
        80,
      );
  }

  // Cron job — rapport mensuel le 1er de chaque mois à 9h00
  @Cron('0 9 1 * *')
  async sendMonthlyReports(): Promise<void> {
    this.logger.log('[Push] Démarrage envoi rapports mensuels...');

    try {
      // ✅ Pagination pour éviter de charger tous les users en RAM
      const batchSize = 100;
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const users = await this.userRepository.find({
          where: { pushToken: undefined },
          relations: ['expenses'],
          skip: page * batchSize,
          take: batchSize,
        });

        // ✅ Filtre les users sans token après récupération
        const usersWithToken = users.filter((u) => u.pushToken);

        if (usersWithToken.length > 0) {
          const now = new Date();
          const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
          const prevYear =
            now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
          const ppMonth = prevMonth === 0 ? 11 : prevMonth - 1;
          const ppYear = prevMonth === 0 ? prevYear - 1 : prevYear;

          const bulk = usersWithToken.map((user) => {
            const expenses = user.expenses || [];

            const filterMonth = (m: number, y: number, t: string) =>
              expenses.filter((e) => {
                const d = new Date(e.date);
                return (
                  d.getMonth() === m && d.getFullYear() === y && e.type === t
                );
              });

            const sum = (list: any[]) =>
              list.reduce((s, e) => s + Math.abs(Number(e.amount)), 0);

            const totalDepenses = sum(
              filterMonth(prevMonth, prevYear, 'expense'),
            );
            const totalRevenus = sum(
              filterMonth(prevMonth, prevYear, 'income'),
            );
            const prevDepenses = sum(filterMonth(ppMonth, ppYear, 'expense'));
            const variationDepenses =
              prevDepenses > 0
                ? ((totalDepenses - prevDepenses) / prevDepenses) * 100
                : 0;

            return {
              pushToken: user.pushToken,
              totalDepenses,
              totalRevenus,
              variationDepenses,
            };
          });

          await this.pushService.sendBulkMonthlyReports(bulk);
          this.logger.log(
            `[Push] Rapports envoyés à ${bulk.length} utilisateurs (page ${page})`,
          );
        }

        hasMore = users.length === batchSize;
        page++;
      }
    } catch (err) {
      this.logger.error('[Push] Erreur rapports mensuels:', err);
    }
  }
}
