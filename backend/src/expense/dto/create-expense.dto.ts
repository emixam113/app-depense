import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  IsInt,
  IsIn,
  IsBoolean,
} from 'class-validator';

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

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;
}
