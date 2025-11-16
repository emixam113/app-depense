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
    private readonly expenseRepository: Repository<Expense>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  //Crée une dépense ou un revenu lié à l’utilisateur connecté
  async create(
    createExpenseDto: CreateExpenseDto,
    userId: number,
  ): Promise<Expense> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    let category: Category | null = null;
    if (createExpenseDto.categoryId) {
      category = await this.categoryRepository.findOne({
        where: { id: createExpenseDto.categoryId },
      });
      if (!category) throw new NotFoundException('Catégory not found');
    }
    const expense = this.expenseRepository.create({
      ...createExpenseDto,
      date: new Date(createExpenseDto.date),
      user,
      category,
    });
    return await this.expenseRepository.save(expense);
  }

   //récupère une dépense particulière
  async findByUser(userId: number): Promise<Expense[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return await this.expenseRepository.find({
      where: { user: { id: userId } },
      relations: ['category', 'user'],
      order: { date: 'DESC' },
    });
  }

  // Récupère une seule dépense
  async findOne(id: number): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: { id },
      relations: ['user', 'category'],
    });

    if (!expense) throw new NotFoundException(`Expense ${id} not found`);
    return expense;
  }

  //Met à jour une dépense (le signe du montant est corrigé automatiquement)
  async update(id: number, dto: UpdateExpenseDto): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: { id },
      relations: ['user', 'category'],
    });

    if (!expense) throw new NotFoundException(`Expense ${id}  not found`);

    if (dto.label !== undefined) expense.label = dto.label;
    if (dto.amount !== undefined) expense.amount = dto.amount;

  //conversion de la date
    if (dto.date !== undefined) expense.date = new Date(dto.date);
    if (dto.type !== undefined) expense.type = dto.type;
    if (dto.categoryId !== undefined) {
      if (dto.categoryId === null) {
        expense.category = null;
      } else {
        const category = await this.categoryRepository.findOne({
          where: { id: dto.categoryId },
        });
        if (!category) throw new NotFoundException('Category not found');
        expense.category = category;
      }
    }
    return await this.expenseRepository.save(expense);
  }

  //Supprime une dépense
  async remove(id: number): Promise<void> {
    const expense = await this.expenseRepository.findOne({ where: { id } });
    if (!expense) throw new NotFoundException('Expense not found');

    await this.expenseRepository.remove(expense);
  }
}