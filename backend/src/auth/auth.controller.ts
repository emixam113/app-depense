import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UseGuards,
  Get,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './JWT/jwt-auth.guard';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * CONNEXION
   */
  @Post('login')
  async login(@Body() body: { email: string; password: string }): Promise<any> {
    const { email, password } = body;
    if (!email || !password) {
      throw new BadRequestException('Email et mot de passe requis.');
    }
    return this.authService.login(email, password);
  }

  /**
   * INSCRIPTION
   */
  @Post('signup')
  async signup(
    @Body()
    body: {
      email: string;
      password: string;
      confirmPassword: string;
      firstName: string;
      lastName: string;
      birthDate: string;
    },
  ) {
    // La validation de la correspondance des mots de passe est gérée dans le service
    return this.authService.signup(body);
  }

  /**
   * RÉCUPÉRATION DU PROFIL (PROTECTION JWT)
   * ✅ CORRIGÉ : Récupère les données réelles en base de données pour inclure le solde
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: any) {
    // req.user est rempli par le JwtStrategy après validation du token.
    // Il contient généralement { sub: id, email: string }
    const userId = req.user.sub || req.user.id;

    // 🛡️ Sécurité & Données : On appelle le service pour obtenir le profil complet
    // avec le solde calculé et sans le mot de passe
    return this.authService.getProfile(userId);
  }

  /**
   * DEMANDE DE RÉINITIALISATION DE MOT DE PASSE
   */
  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    const { email } = body;
    if (!email) {
      throw new BadRequestException('Email requis.');
    }
    return this.authService.forgotPassword(email);
  }

  /**
   * RÉINITIALISATION DU MOT DE PASSE AVEC CODE
   */
  @Post('reset-password')
  async resetPassword(
    @Body()
    body: {
      email: string;
      code: string;
      newPassword: string;
    },
  ) {
    const { email, code, newPassword } = body;
    if (!email || !code || !newPassword) {
      throw new BadRequestException(
        'Email, code et nouveau mot de passe requis.',
      );
    }
    return this.authService.resetPassword(email, code, newPassword);
  }
}
