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

  //Connexion
  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
  ): Promise<any> {
    const { email, password } = body;
    if (!email || !password) {
      throw new BadRequestException('Email et mot de passe requis.');
    }
    return this.authService.login(email, password);
  }

  // Inscription
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
    return this.authService.signup(body);
  }

  //Demande de réinitialisation du mot de passe
  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    const { email } = body;
    if (!email) {
      throw new BadRequestException('Email requis.');
    }
    return this.authService.forgotPassword(email);
  }

  //Réinitialisation du mot de passe avec le code reçu
  @Post('reset-password')
  async resetPassword(
    @Body()
    body: { email: string; code: string; newPassword: string },
  ) {
    const { email, code, newPassword } = body;
    if (!email || !code || !newPassword) {
      throw new BadRequestException(
        'Email, code et nouveau mot de passe requis.',
      );
    }
    return this.authService.resetPassword(email, code, newPassword);
  }

  //Récupération du profil utilisateur (protégée par JWT)
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: Request) {
    return req.user; //Le payload JWT contient { sub, email }
  }
}