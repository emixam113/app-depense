import { Controller, Post, Body, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDTO } from './DTO/Signup.dto';
import { LoginDto } from './DTO/login.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
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

  @Post('reset-password')
  async resetPassword(@Body() body: { email: string; newPassword: string }) {
    const { email, newPassword } = body;

    const result = await this.userService.updatePassword(email, newPassword);

    if (!result) {
      throw new NotFoundException("Utilisateur non trouvé");
    }

    return { success: true, message: 'Mot de passe mis à jour avec succès.' };
  }
}