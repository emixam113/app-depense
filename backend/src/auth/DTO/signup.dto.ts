import {IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, Matches, IsDateString} from 'class-validator';

export class SignUpDto{
  @IsNotEmpty({message:'First Name is required'})
  lastName: string;

  @IsNotEmpty({message: 'Last Name is required'})
  firstName: string; 

  @IsEmail({}, {message: "email is invalid"})
  email: string; 

  @MinLength(8, {message: 'Password must be at least 8 characters long'})
  @MaxLength(12, {message: 'Password must be at most 12 characters long'})
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {message: 'Password must contain at least one uppercase letter, one lowercase letter and one number'})
  password: string; 

  @IsNotEmpty({message: 'confirm password is required'})
  confirmPassword: string; 

  @IsDateString({}, {message: 'Birth Date is invalid'})
  birthDate: Date; //YYY/ MM/ DD

}
