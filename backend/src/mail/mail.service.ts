import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendResetPasswordConfirmation(email: string, firstname: string) {
    // Générer un token sécurisé
    const token = this.generateResetToken();
    const resetUrl = `http://localhost:3000/reset-password?token=${token}`;
    
    await this.mailerService.sendMail({
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      template: './reset-password',
      context: {
        name: firstname,
        url: resetUrl,
      },
    });

    return token; // À stocker en base de données avec une date d'expiration
  }

  async sendWelcomeEmail(email: string, name: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Bienvenue sur notre application de suivi des dépenses !',
      template: './welcome',
      context: {
        name,
      },
    });
  }

  private generateResetToken(): string {
    // Génère un token sécurisé de 32 caractères
    return require('crypto').randomBytes(16).toString('hex');
  }
}