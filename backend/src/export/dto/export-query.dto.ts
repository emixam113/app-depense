import { IsOptional, IsDateString, IsIn, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ExportQueryDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsIn(['expense', 'income'])
  type?: 'expense' | 'income';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;
}
