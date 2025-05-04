import { IsString, IsEmail, IsDateString, MinLength, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  lastname: string;

  @IsNotEmpty()
  @IsString()
  firstname: string;

  @IsNotEmpty()
  @IsDateString()
  birthdate: string; // Ou Date selon votre configuration

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6) // Exemple de longueur minimale
  password: string;

  @IsNotEmpty()
  @IsString()
  confirmPassword: string;
}