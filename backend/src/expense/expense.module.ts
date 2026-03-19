import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from './entity/expense.entity';
import { ExpenseService } from './expense.service';
import { ExpenseController } from './expense.controller';
import {Category} from '../category/entity/category.entity';
import {User} from '../user/entity/user.entity';
@Module({
  imports: [TypeOrmModule.forFeature(
    [Expense,
      Category,
    User, 
    ]
  )],
  controllers: [ExpenseController],
  providers: [ExpenseService],
  exports: [ExpenseService]
})
export class ExpenseModule { }
