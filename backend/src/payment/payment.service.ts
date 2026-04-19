import { Injectable, Logger } from '@nestjs/common';
import { UserService } from '../user/user.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(private readonly userService: UserService) {}

  async handleWebhookEvent(type: string, appUserId: string) {
    // 1. Gérer l'événement de TEST de RevenueCat
    if (type === 'TEST') {
      this.logger.log('🔔 Webhook de TEST reçu et validé avec succès !');
      return; // On s'arrête ici pour le test
    }

    // 2. Tenter de convertir l'ID pour les vrais achats
    const userId = parseInt(appUserId);

    if (isNaN(userId)) {
      this.logger.error(
        `ID utilisateur invalide reçu de RevenueCat : ${appUserId}`,
      );
      // On ne lève plus d'exception ici pour ne pas renvoyer un 400 à RevenueCat
      return;
    }

    // 3. Logique pour les vrais événements
    switch (type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'UNCANCELLED':
        await this.userService.updatePremiumStatus(userId, true);
        this.logger.log(`Statut PREMIUM activé pour l'utilisateur ${userId}`);
        break;

      case 'EXPIRATION':
      case 'CANCELLATION':
      case 'BILLING_ERROR':
        await this.userService.updatePremiumStatus(userId, false);
        this.logger.log(
          `Statut PREMIUM désactivé pour l'utilisateur ${userId}`,
        );
        break;

      default:
        this.logger.log(`Événement RevenueCat ignoré : ${type}`);
    }
  }
}
