// src/Notifications/Push.service.ts
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

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

  // ════════════════════════════════════════════════════════
  // MÉTHODE PRINCIPALE — Envoyer une ou plusieurs notifs
  // ════════════════════════════════════════════════════════
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
      const { data } = await axios.post(this.EXPO_PUSH_URL, valid, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${process.env.EXPO_ACCESS_TOKEN}`, // Expo Pro
        },
      });

      const tickets: ExpoPushTicket[] = data.data;
      tickets.forEach((t, i) => {
        if (t.status === 'error')
          this.logger.error(`[Push] Ticket ${i} erreur: ${t.message}`);
      });
      return tickets;
    } catch (err) {
      this.logger.error('[Push] Erreur axios:', err);
      return [];
    }
  }

  // ════════════════════════════════════════════════════════
  // 1. DÉPENSES +20% VS MOIS DERNIER
  // ════════════════════════════════════════════════════════
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

  // ════════════════════════════════════════════════════════
  // 2. REVENUS EN BAISSE
  // ════════════════════════════════════════════════════════
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

  // ════════════════════════════════════════════════════════
  // 3. ÉCONOMIES DÉTECTÉES
  // ════════════════════════════════════════════════════════
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

  // ════════════════════════════════════════════════════════
  // 4. ALERTE BUDGET DÉPASSÉ (80% ou 100%)
  // ════════════════════════════════════════════════════════
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

  // ════════════════════════════════════════════════════════
  // 5. RAPPORT MENSUEL (1er du mois)
  // ════════════════════════════════════════════════════════
  async notifyMonthlyReport(
    pushToken: string,
    totalDepenses: number,
    totalRevenus: number,
    variationDepenses: number,
  ): Promise<void> {
    const variation =
      variationDepenses > 0
        ? `+${variationDepenses.toFixed(0)}% vs mois dernier 📈`
        : variationDepenses < 0
          ? `${variationDepenses.toFixed(0)}% vs mois dernier 📉`
          : 'Stable vs mois dernier';

    await this.sendPushNotification([
      {
        to: pushToken,
        title: '📊 Votre bilan du mois est prêt !',
        body: `Dépenses : ${totalDepenses.toFixed(2)} € · Revenus : ${totalRevenus.toFixed(2)} € · ${variation}`,
        sound: 'default',
        priority: 'normal',
        channelId: 'rapport',
        data: {
          type: 'monthly_report',
          totalDepenses,
          totalRevenus,
          variationDepenses,
        },
      },
    ]);
  }

  // ════════════════════════════════════════════════════════
  // ENVOI EN MASSE — max 100 messages par requête Expo
  // ════════════════════════════════════════════════════════
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

    for (const chunk of chunks) {
      await this.sendPushNotification(
        chunk.map((u) => ({
          to: u.pushToken,
          title: '📊 Votre bilan du mois est prêt !',
          body: `Dépenses : ${u.totalDepenses.toFixed(2)} € · Revenus : ${u.totalRevenus.toFixed(2)} €`,
          sound: 'default' as const,
          priority: 'normal' as const,
          channelId: 'rapport',
          data: { type: 'monthly_report' },
        })),
      );
      if (chunks.length > 1) await new Promise((r) => setTimeout(r, 200));
    }
    this.logger.log(
      `[Push] Rapport mensuel envoyé à ${users.length} utilisateurs`,
    );
  }
}
