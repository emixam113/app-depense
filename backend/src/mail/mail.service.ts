import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

const appName = 'Suivi des Dépenses';
const currentYear = new Date().getFullYear();

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendPasswordResetEmail(email: string, token: string, firstname: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Réinitialisation de votre mot de passe',
        template: 'reset-password',
        context: {
          email: email,
          token: token,
          firstName: firstname,
          appName: appName,
          currentYear: new Date().getFullYear()
        },
      });
      console.log('Email de réinitialisation envoyé à', email);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de réinitialisation:', error);
      throw error;
    }
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

  async sendTestEmail(email: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Test d\'envoi d\'email',
        template: 'test',
        context: {
          email: email,
          token: 'TEST-TOKEN-123456',
          firstName: 'Test',
          appName: appName,
          currentYear: new Date().getFullYear()
        },
      });
      console.log('Email de test envoyé avec succès à', email);
      return { success: true, message: 'Email de test envoyé avec succès' };
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de test:', error);
      throw error;
    }
  }
}