import { Controller, Post, Body, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
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
  @HttpCode(HttpStatus.ACCEPTED)
  async forgotPassword(@Body() body: { email?: string, birthdate?: string }) {
    if (!body.email || !body.birthdate) {
      throw new BadRequestException('Email et date de naissance sont requis');
    }
    
    // Nettoyer et valider l'email
    const email = body.email.trim().toLowerCase();
    if (!email.includes('@')) {
      throw new BadRequestException('Format d\'email invalide');
    }
    
    // Nettoyer la date de naissance
    const birthdate = body.birthdate.trim();
    
    return this.authService.requestPasswordReset(email, birthdate);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    try {
      const result = await this.authService.resetPassword(
        resetPasswordDto.token,
        resetPasswordDto.newPassword,
        resetPasswordDto.email
      );
      return { success: true, message: result.message };
    } catch (error) {
      throw new BadRequestException(error.message || 'Erreur lors de la réinitialisation du mot de passe');
    }
  }
}