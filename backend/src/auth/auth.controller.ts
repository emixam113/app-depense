import { Controller, Post, Body, HttpCode, HttpStatus, BadRequestException, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { SignupDTO } from './DTO/Signup.dto';
import { LoginDto } from './DTO/login.dto';
import {ResetPasswordDto} from './DTO/reset-password.dto'
import { UserService } from '../user/user.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) { }

  @Post('signup')
  async signup(@Body() signupDTO: SignupDTO) {
    console.log('Formulaire d\'inscription reçu :');
    console.log('Email:', signupDTO.email);
    console.log('Password:', signupDTO.password);
    console.log('Prénom:', signupDTO.firstName);
    console.log('Nom:', signupDTO.lastName);
    console.log('Date de naissance:', signupDTO.birthDate);
    return this.authService.signup(signupDTO);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    console.log('Formulaire de connexion reçu :');
    console.log('Email:', loginDto.email);
    console.log('Password:', loginDto.password);
    return this.authService.login(loginDto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: { email?: string, birthdate?: string }) {
    try {
      if (!body.email || !body.birthdate) {
        throw new BadRequestException('Email et date de naissance sont requis');
      }
      
      // Nettoyer les entrées
      const email = body.email.trim().toLowerCase();
      const birthdate = body.birthdate.trim();
      
      const result = await this.authService.requestPasswordReset(email, birthdate);
      return result;
      
    } catch (error) {
      // Les erreurs spécifiques sont déjà gérées par le service
      // On laisse passer les erreurs pour qu'elles soient traitées par le filtre d'exceptions global
      throw error;
    }
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    try {
      const result = await this.authService.resetPassword(resetPasswordDto);
      return { success: true, message: result.message };
    } catch (error) {
      throw new BadRequestException(error.message || 'Erreur lors de la réinitialisation du mot de passe');
    }
  }
}