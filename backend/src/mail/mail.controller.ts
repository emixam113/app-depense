import {
  Controller,
  Post,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { MailService } from './mail.service';
import { UserService } from '../user/user.service';
import { ResetTokenService } from '../auth/reset-token.service';

@Controller('mail')
export class MailController {
  constructor(
    private readonly mailService: MailService,
    private readonly userService: UserService,
    private readonly resetTokenService: ResetTokenService,
  ) {}

  /**
   * Test simple d’envoi d’email
   */
  @Post('test')
  async sendTestEmail(@Body('email') email: string) {
    if (!email) throw new BadRequestException('Email requis');
    return this.mailService.sendTestEmail(email);
  }

  /**
   * Envoi du code de réinitialisation
   */
  @Post('forgot-password')
  async forgotPassword(
    @Body('email') email: string,
    @Body('birthdate') birthdate: string,
  ) {
    if (!email || !birthdate) {
      throw new BadRequestException('Email et date de naissance requis');
    }

    // 🔍 Vérifier que l'utilisateur existe
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new BadRequestException("Aucun utilisateur trouvé avec cet email.");
    }

    // 🔍 Vérifier la date de naissance
    const userBirthDate = new Date(user.birthDate).toISOString().split('T')[0];
    const formattedBirthdate = new Date(birthdate).toISOString().split('T')[0];

    if (userBirthDate !== formattedBirthdate) {
      throw new BadRequestException("La date de naissance ne correspond pas.");
    }

    // 🧩 Créer un code à 3 chiffres
    const resetToken = await this.resetTokenService.createToken(user);

    // ✉️ Envoyer le mail
    await this.mailService.sendPasswordResetEmail(
      user.email,
      resetToken.code, // ✅ c’est bien “code” maintenant
      user.firstName,
    );

    console.log(`✅ Email de réinitialisation envoyé à ${user.email} avec le code ${resetToken.code}`);

    return {
      success: true,
      message: 'Code de réinitialisation envoyé avec succès',
    };
  }
}
