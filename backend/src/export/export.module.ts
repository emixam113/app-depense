import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';
import { Expense } from '../expense/entity/expense.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Expense]),
    UserModule
  ],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
