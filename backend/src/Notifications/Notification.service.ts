// src/Notifications/Notification.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushService } from './Push.service';
import { User } from '../user/entity/user.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly pushService: PushService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // ════════════════════════════════════════════════════════
  // ENREGISTRER LE TOKEN PUSH D'UN UTILISATEUR
  // Appelé depuis NotificationController après le login
  // ════════════════════════════════════════════════════════
  async savePushToken(userId: string, pushToken: string): Promise<void> {
    await this.userRepository.update(userId, { pushToken });
    this.logger.log(`[Push] Token enregistré pour user ${userId}`);
  }

  // ════════════════════════════════════════════════════════
  // ANALYSER ET NOTIFIER après chaque transaction
  // Appelé depuis ExpenseService après ajout d'une transaction
  // ════════════════════════════════════════════════════════
  async analyzeAndNotify(params: {
    pushToken: string;
    changeDepenses: number; // variation % dépenses vs mois dernier
    changeRevenus: number; // variation % revenus vs mois dernier
    currentDepenses: number; // total dépenses ce mois
    currentRevenus: number; // total revenus ce mois
  }): Promise<void> {
    const {
      pushToken,
      changeDepenses,
      changeRevenus,
      currentDepenses,
      currentRevenus,
    } = params;
    if (!pushToken) return;

    // 1. Dépenses +20% vs mois dernier
    if (changeDepenses >= 20 && currentDepenses > 0)
      await this.pushService.notifyExpensesUp(pushToken, changeDepenses);

    // 2. Revenus en baisse de -10%
    if (changeRevenus <= -10 && currentRevenus > 0)
      await this.pushService.notifyRevenuesDown(pushToken, changeRevenus);

    // 3. Économies détectées (-10% de dépenses)
    if (changeDepenses <= -10 && currentDepenses > 0)
      await this.pushService.notifyExpensesDown(pushToken, changeDepenses);
  }

  // ════════════════════════════════════════════════════════
  // ALERTE BUDGET DÉPASSÉ
  // Appelé depuis ExpenseService après chaque dépense
  // ════════════════════════════════════════════════════════
  async checkAndNotifyBudget(params: {
    pushToken: string;
    categoryName: string;
    spent: number; // total dépensé dans la catégorie ce mois
    budget: number; // budget max défini par l'utilisateur
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

  // ════════════════════════════════════════════════════════
  // CRON JOB — RAPPORT MENSUEL
  // Se déclenche automatiquement le 1er de chaque mois à 9h00
  // ════════════════════════════════════════════════════════
  @Cron('0 9 1 * *')
  async sendMonthlyReports(): Promise<void> {
    this.logger.log('[Push] Démarrage envoi rapports mensuels...');

    try {
      // Récupérer tous les utilisateurs avec leurs transactions
      const users = await this.userRepository.find({ relations: ['expenses'] });
      const usersWithToken = users.filter((u) => u.pushToken);

      if (usersWithToken.length === 0) {
        this.logger.warn('[Push] Aucun utilisateur avec token push');
        return;
      }

      // Calculer les stats du mois précédent
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
            return d.getMonth() === m && d.getFullYear() === y && e.type === t;
          });

        const sum = (list: any[]) =>
          list.reduce((s, e) => s + Math.abs(parseFloat(e.amount)), 0);

        const totalDepenses = sum(filterMonth(prevMonth, prevYear, 'expense'));
        const totalRevenus = sum(filterMonth(prevMonth, prevYear, 'income'));
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
      this.logger.log(`[Push] Rapports envoyés à ${bulk.length} utilisateurs`);
    } catch (err) {
      this.logger.error('[Push] Erreur rapports mensuels:', err);
    }
  }
}
