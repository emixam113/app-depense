import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from './entity/expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { User } from '../user/entity/user.entity';
import { Category } from '../category/entity/category.entity';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(dto: CreateExpenseDto): Promise<Expense> {
    const user = await this.userRepository.findOneBy({ id: dto.userId });
    if (!user) throw new NotFoundException('User not found');

    let category: Category | null = null;
    if (dto.categoryId) {
      category = await this.categoryRepository.findOneBy({ id: dto.categoryId });
      if (!category) throw new NotFoundException('Category not found');
    }

    const expense = this.expenseRepository.create({
      ...dto,
      user,
      category,
    });

    return this.expenseRepository.save(expense);
  }




  findAll(): Promise<Expense[]> {
    return this.expenseRepository.find({ relations: ['user', 'category'] });
  }

  async findOne(id: number): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: { id },
      relations: ['user', 'category'],
    });

    if (!expense) throw new NotFoundException(`Expense ${id} not found`);
    return expense;
  }

  async update(id: number, dto: UpdateExpenseDto): Promise<Expense> {
    const expense = await this.expenseRepository.preload({
      id,
      ...dto,
    });

    if (!expense) throw new NotFoundException(`Expense ${id} not found`);

    if (dto.userId !== undefined) {
      if (dto.userId === null) {
        expense.user = null;
      } else {
        const user = await this.userRepository.findOneBy({ id: dto.userId });
        if (!user) throw new NotFoundException('User not found');
        expense.user = user;
      }
    }

    if (dto.categoryId !== undefined) {
      if (dto.categoryId === null) {
        expense.category = null;
      } else {
        const category = await this.categoryRepository.findOneBy({ id: dto.categoryId });
        if (!category) throw new NotFoundException('Category not found');
        expense.category = category;
      }
    }

    await this.expenseRepository.save(expense);
    return this.findOne(expense.id); // recharge avec relations
  }

  async findOneWithCategory(id: number): Promise<Expense> {
    return this.expenseRepository.findOne({
      where: { id },
      relations: ['category'],
    });
  }

  async remove(id: number): Promise<void> {
    const expense = await this.expenseRepository.findOneBy({ id });
    if (!expense) throw new NotFoundException('Expense not found');
    await this.expenseRepository.remove(expense);
  }
}
