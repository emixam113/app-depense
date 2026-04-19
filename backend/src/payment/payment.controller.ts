import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { UserService } from '../user/user.service';

@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly userService: UserService) {}

  @Post('webhook')
  async handleRevenueCatWebhook(
    @Body() body: any,
    @Headers('authorization') authHeader: string,
  ) {
    // 1. Protection : Vérification du Secret Token
    const webhookToken = process.env.REVENUECAT_WEBHOOK_TOKEN;
    if (!authHeader || authHeader !== `Bearer ${webhookToken}`) {
      this.logger.warn('Tentative d’accès au webhook sans token valide');
      throw new UnauthorizedException('Token non valide');
    }

    // 2. Vérification de la structure du body (Évite les crashs)
    if (!body || !body.event) {
      throw new BadRequestException('Format de webhook invalide');
    }

    const { type, app_user_id } = body.event;
    const userId = parseInt(app_user_id);

    // 3. Protection : Validation de l'ID utilisateur
    if (!app_user_id || isNaN(userId)) {
      this.logger.error(`ID utilisateur invalide reçu : ${app_user_id}`);
      throw new BadRequestException('ID utilisateur manquant ou invalide');
    }

    this.logger.log(`Événement reçu [${type}] pour l'utilisateur ${userId}`);

    // 4. Traitement des événements
    switch (type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'UNCANCELLED':
        // Activation du Premium
        await this.userService.updatePremiumStatus(userId, true);
        this.logger.log(`Statut PREMIUM activé pour l'utilisateur ${userId}`);
        break;

      case 'EXPIRATION':
      case 'CANCELLATION':
      case 'BILLING_ERROR':
        // Désactivation du Premium
        await this.userService.updatePremiumStatus(userId, false);
        this.logger.log(
          `Statut PREMIUM désactivé pour l'utilisateur ${userId}`,
        );
        break;

      case 'TEST':
        this.logger.log('Test du webhook RevenueCat réussi');
        break;

      default:
        this.logger.log(`Événement non traité (sans impact) : ${type}`);
    }

    return { received: true };
  }
}
