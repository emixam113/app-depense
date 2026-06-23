import {IsNotEmpty, IsString, Matches} from 'class-validator';

export class CreateCategoryDto{
  @IsNotEmpty()
  @IsString()
  name: string;


  @IsNotEmpty()
  @IsString()
  @Matches(/^#([0-9A-Fa-f]{6})$/, { message: 'La couleur doit être un code hexadécimal valide' })
  color: string;
}
