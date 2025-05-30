import {IsEmail, IsNotEmpty, MinLength, IsDateString, isNotEmpty} from 'class-validator';

export class SignupDTO{
  @IsNotEmpty({message: 'Le prenom est requis'})
  firstName: string; 

  @IsNotEmpty({message:'le nom est requis'})
  lastName: string; 

  @IsEmail({}, {message: "Email invalide"})
  email: string;
  
  @IsDateString({}, {message: "Date de Naissance Invalide"})
  birthDate: string;

  @MinLength(8, { message: 'Le mot de passe doit faire au moins 8 caractères' })
  password: string;

  @MinLength(8, { message: 'La confirmation doit faire au moins 8 caractères' })
  confirmPassword: string;

}