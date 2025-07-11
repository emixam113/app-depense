import { IsString, IsNumber, IsDateString, IsOptional, IsInt } from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  label: string;

  @IsNumber()
  amount: number;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsInt()
  userId?: number;
}