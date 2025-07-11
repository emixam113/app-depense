import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  ParseIntPipe,
} from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Expense } from './entity/expense.entity';

@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  async create(@Body() dto: CreateExpenseDto): Promise<Expense> {
    const created = await this.expenseService.create(dto);
    return this.expenseService.findOneWithCategory(created.id); // Returns the expense with the category relation
  }
  
  @Get()
  findAll(): Promise<Expense[]> {
    return this.expenseService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Expense> {
    return this.expenseService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExpenseDto,
  ): Promise<Expense> {
    return this.expenseService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.expenseService.remove(id);
  }
}
