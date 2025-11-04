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

  /**
   * 🔹 Crée une dépense ou un revenu lié à l’utilisateur connecté
   */
  async create(
    createExpenseDto: CreateExpenseDto,
    userId: number,
  ): Promise<Expense> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    let category: Category | null = null;
    if (createExpenseDto.categoryId) {
      category = await this.categoryRepository.findOne({
        where: { id: createExpenseDto.categoryId },
      });
      if (!category) throw new NotFoundException('Catégorie non trouvée');
    }

    const expense = this.expenseRepository.create({
      ...createExpenseDto,
      date: new Date(createExpenseDto.date), // ✅ conversion explicite en Date
      user,
      category,
    });

    // ✅ Le signe du montant est géré par l’entité Expense (@BeforeInsert)
    return await this.expenseRepository.save(expense);
  }

  /**
   * 🔹 Récupère toutes les dépenses/revenus d’un utilisateur
   */
  async findByUser(userId: number): Promise<Expense[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    return await this.expenseRepository.find({
      where: { user: { id: userId } },
      relations: ['category', 'user'],
      order: { date: 'DESC' },
    });
  }

  /**
   * 🔹 Récupère une seule dépense
   */
  async findOne(id: number): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: { id },
      relations: ['user', 'category'],
    });

    if (!expense) throw new NotFoundException(`Dépense ${id} introuvable`);
    return expense;
  }

  /**
   * 🔹 Met à jour une dépense (le signe du montant est corrigé automatiquement)
   */
  async update(id: number, dto: UpdateExpenseDto): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: { id },
      relations: ['user', 'category'],
    });

    if (!expense) throw new NotFoundException(`Dépense ${id} introuvable`);

    if (dto.label !== undefined) expense.label = dto.label;
    if (dto.amount !== undefined) expense.amount = dto.amount;

    // ✅ conversion propre du champ date
    if (dto.date !== undefined) expense.date = new Date(dto.date);

    if (dto.type !== undefined) expense.type = dto.type;

    if (dto.categoryId !== undefined) {
      if (dto.categoryId === null) {
        expense.category = null;
      } else {
        const category = await this.categoryRepository.findOne({
          where: { id: dto.categoryId },
        });
        if (!category) throw new NotFoundException('Catégorie non trouvée');
        expense.category = category;
      }
    }

    // ✅ @BeforeUpdate() dans l'entité s'occupe du signe du montant
    return await this.expenseRepository.save(expense);
  }

  /**
   * 🔹 Supprime une dépense
   */
  async remove(id: number): Promise<void> {
    const expense = await this.expenseRepository.findOne({ where: { id } });
    if (!expense) throw new NotFoundException('Dépense introuvable');

    await this.expenseRepository.remove(expense);
  }
}
