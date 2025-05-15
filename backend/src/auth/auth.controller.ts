import {Controller, Post, Body} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDTO } from './DTO/Signup.dto';
import { LoginDto } from './DTO/login.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';

@Controller('auth')
export class AuthController{
  constructor(private readonly authService: AuthService){}

  @Post('signup')
  async signup(@Body() signupDTO: SignupDTO ){
    console.log('📝 Formulaire d\'inscription reçu :');
    console.log('✉️ Email:', signupDTO.email);
    console.log('🔐 Password:', signupDTO.password);
    console.log('🧑 Prénom:', signupDTO.firstName);
    console.log('👨 Nom:', signupDTO.lastName);
    console.log('🎂 Date de naissance:', signupDTO.birthDate);
    return this.authService.signup(signupDTO);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto){
    console.log('🔑 Formulaire de connexion reçu :');
    console.log('✉️ Email:', loginDto.email);
    console.log('🔐 Password:', loginDto.password);
    return this.authService.login(loginDto);
  }
}