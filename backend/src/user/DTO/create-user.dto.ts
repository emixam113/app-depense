import { IsString, IsEmail, IsDateString, MinLength, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsDateString()
  birthDate: string; // Ou Date selon votre configuration

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