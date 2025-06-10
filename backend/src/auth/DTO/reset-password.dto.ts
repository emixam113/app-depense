import { IsString, MinLength, IsNotEmpty, IsEmail } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  newPassword: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}
