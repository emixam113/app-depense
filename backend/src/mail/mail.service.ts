import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

const appName = 'Suivi des Dépenses';
const currentYear = new Date().getFullYear();

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  /**
   * Envoi de l'email contenant le code de réinitialisation à 3 chiffres
   */
  async sendPasswordResetEmail(email: string, code: string, firstName: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Réinitialisation de votre mot de passe',
        template: 'reset-password', // ton fichier src/mail/templates/reset-password.hbs
        context: {
          email,
          code, // ici on envoie le code à 3 chiffres
          firstName,
          appName,
          currentYear,
        },
      });

      console.log(`✅ Email de réinitialisation envoyé à ${email} avec le code ${code}`);
    } catch (error) {
      console.error("❌ Erreur lors de l'envoi de l'email de réinitialisation :", error);
      throw error;
    }
  }



  /**
   * Envoi d'un email de test (pour vérifier le système d'envoi)
   */
  async sendTestEmail(email: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: "Test d'envoi d'email",
        template: 'test',
        context: {
          email,
          code: '123', // petit code factice pour test
          firstName: 'Test',
          appName,
          currentYear,
        },
      });

      console.log(`✅ Email de test envoyé avec succès à ${email}`);
      return { success: true, message: 'Email de test envoyé avec succès' };
    } catch (error) {
      console.error("❌ Erreur lors de l'envoi de l'email de test :", error);
      throw error;
    }
  }
}
