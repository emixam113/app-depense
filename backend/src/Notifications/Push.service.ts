import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entity/user.entity';

interface ExpoPushMessage {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Méthode principale — envoyer une ou plusieurs notifs
  async sendPushNotification(
    messages: ExpoPushMessage[],
  ): Promise<ExpoPushTicket[]> {
    const valid = messages.filter((m) => {
      const tokens = Array.isArray(m.to) ? m.to : [m.to];
      return tokens.every((t) => t?.startsWith('ExponentPushToken['));
    });

    if (valid.length === 0) {
      this.logger.warn('[Push] Aucun token valide');
      return [];
    }

    try {
      // ✅ fetch natif Node 22
      const response = await fetch(this.EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(valid),
      });

      const data = await response.json();
      const tickets: ExpoPushTicket[] = data.data;

      // Suppression des tokens expirés/invalides
      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        if (ticket.status === 'error') {
          this.logger.error(`[Push] Ticket ${i} erreur: ${ticket.message}`);
          if (ticket.details?.error === 'DeviceNotRegistered') {
            const token = Array.isArray(valid[i].to)
              ? valid[i].to[0]
              : valid[i].to;
            await this.userRepository.update(
              { pushToken: token as string },
              { pushToken: null },
            );
            this.logger.warn(
              `[Push] Token supprimé (DeviceNotRegistered): ${token}`,
            );
          }
        }
      }

      return tickets;
    } catch (err) {
      this.logger.error('[Push] Erreur envoi push:', err);
      return [];
    }
  }

  // 1. Dépenses +20% vs mois dernier
  async notifyExpensesUp(
    pushToken: string,
    changePercent: number,
  ): Promise<void> {
    await this.sendPushNotification([
      {
        to: pushToken,
        title: '📈 Vos dépenses augmentent !',
        body: `Vous dépensez ${changePercent.toFixed(0)}% de plus que le mois dernier. Pensez à revoir votre budget.`,
        sound: 'default',
        priority: 'high',
        channelId: 'budget',
        data: { type: 'expenses_up', changePercent },
      },
    ]);
  }

  // 2. Revenus en baisse
  async notifyRevenuesDown(
    pushToken: string,
    changePercent: number,
  ): Promise<void> {
    await this.sendPushNotification([
      {
        to: pushToken,
        title: '💰 Vos revenus sont en baisse',
        body: `Vos revenus ont diminué de ${Math.abs(changePercent).toFixed(0)}% par rapport au mois dernier.`,
        sound: 'default',
        priority: 'high',
        channelId: 'budget',
        data: { type: 'revenues_down', changePercent },
      },
    ]);
  }

  // 3. Économies détectées
  async notifyExpensesDown(
    pushToken: string,
    changePercent: number,
  ): Promise<void> {
    await this.sendPushNotification([
      {
        to: pushToken,
        title: '🎉 Bravo, vous économisez !',
        body: `Vos dépenses ont baissé de ${Math.abs(changePercent).toFixed(0)}% ce mois-ci. Continuez comme ça !`,
        sound: 'default',
        priority: 'normal',
        channelId: 'default',
        data: { type: 'expenses_down', changePercent },
      },
    ]);
  }

  // 4. Alerte budget dépassé (80% ou 100%)
  async notifyBudgetExceeded(
    pushToken: string,
    categoryName: string,
    spent: number,
    budget: number,
    level: 80 | 100,
  ): Promise<void> {
    const is100 = level === 100;
    await this.sendPushNotification([
      {
        to: pushToken,
        title: is100
          ? `🚨 Budget ${categoryName} dépassé !`
          : `⚠️ Budget ${categoryName} à 80%`,
        body: is100
          ? `Dépensé ${spent.toFixed(2)} € sur ${budget.toFixed(2)} €. Dépassement de ${(spent - budget).toFixed(2)} €.`
          : `Vous avez utilisé ${spent.toFixed(2)} € sur ${budget.toFixed(2)} € prévus.`,
        sound: 'default',
        priority: 'high',
        channelId: 'budget',
        data: { type: 'budget_exceeded', categoryName, spent, budget, level },
      },
    ]);
  }

  // 5. Envoi en masse — rapport mensuel
  async sendBulkMonthlyReports(
    users: Array<{
      pushToken: string;
      totalDepenses: number;
      totalRevenus: number;
      variationDepenses: number;
    }>,
  ): Promise<void> {
    const chunks: (typeof users)[] = [];
    for (let i = 0; i < users.length; i += 100)
      chunks.push(users.slice(i, i + 100));

    for (let i = 0; i < chunks.length; i++) {
      await this.sendPushNotification(
        chunks[i].map((u) => {
          const variation =
            u.variationDepenses > 0
              ? `+${u.variationDepenses.toFixed(0)}% vs mois dernier 📈`
              : u.variationDepenses < 0
                ? `${u.variationDepenses.toFixed(0)}% vs mois dernier 📉`
                : 'Stable vs mois dernier';

          return {
            to: u.pushToken,
            title: '📊 Votre bilan du mois est prêt !',
            body: `Dépenses : ${u.totalDepenses.toFixed(2)} € · Revenus : ${u.totalRevenus.toFixed(2)} € · ${variation}`,
            sound: 'default' as const,
            priority: 'normal' as const,
            channelId: 'rapport',
            data: { type: 'monthly_report' },
          };
        }),
      );

      // Délai uniquement entre les chunks, pas après le dernier
      if (i < chunks.length - 1) await new Promise((r) => setTimeout(r, 200));
    }

    this.logger.log(
      `[Push] Rapport mensuel envoyé à ${users.length} utilisateurs`,
    );
  }
}
