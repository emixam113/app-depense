import { IsString, IsNumber, IsDateString, IsOptional } from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  label: string;

  @IsNumber()
  amount: number;

  @IsDateString()
  date: string;

  @IsOptional()
  categoryId?: number;

  @IsOptional()
  userId?: number;
} 