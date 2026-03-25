import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';
import { Expense } from '../expense/entity/expense.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Expense])],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
