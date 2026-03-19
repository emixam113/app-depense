import { IsString, IsNumber, IsDateString, IsOptional, IsInt, IsIn } from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  label: string;

  @IsNumber()
  amount: number;

  @IsDateString()
  date: string;

  @IsIn(['expense', 'income'])
  type: 'expense' | 'income';

  @IsOptional()
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsInt()
  userId?: number;
}
