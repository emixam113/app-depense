import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  ParseIntPipe,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Expense } from './entity/expense.entity';
import { JwtAuthGuard } from '../auth/JWT/jwt-auth.guard';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  async create(@Body() dto: CreateExpenseDto, @Req() req): Promise<Expense> {
    const userId = req.user.id;
    const created = await this.expenseService.create(dto, userId);
    return this.expenseService.findOne(created.id);
  }

  @Get('me')
  async findMine(@Req() req): Promise<Expense[]> {
    const userId = req.user.id;
    return this.expenseService.findByUser(userId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
  ): Promise<Expense> {
    const expense = await this.expenseService.findOne(id);

    if (expense.user.id !== req.user.id) {
      throw new UnauthorizedException('Cette dépense ne vous appartient pas.');
    }

    return expense;
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExpenseDto,
    @Req() req,
  ): Promise<Expense> {
    const expense = await this.expenseService.findOne(id);

    if (expense.user.id !== req.user.id) {
      throw new UnauthorizedException('Accès refusé : dépense non autorisée.');
    }

    return this.expenseService.update(id, dto);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
  ): Promise<void> {
    const expense = await this.expenseService.findOne(id);

    if (expense.user.id !== req.user.id) {
      throw new UnauthorizedException('Accès refusé : dépense non autorisée.');
    }

    return this.expenseService.remove(id);
  }
}
