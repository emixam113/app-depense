import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
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
   * Crée une dépense/revenu avec quota mensuel (Anti-Spam & Freemium)
   */
  async create(
    createExpenseDto: CreateExpenseDto,
    userId: number,
  ): Promise<Expense> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const [user, count] = await Promise.all([
      this.userRepository.findOne({ where: { id: userId } }),
      this.expenseRepository.count({
        where: {
          user: { id: userId },
          date: Between(startOfMonth, endOfMonth),
        },
      }),
    ]);

    if (!user) throw new NotFoundException('Utilisateur introuvable');

    if (!user.isPremium && count >= 50) {
      throw new ForbiddenException(
        "Limite mensuelle de 50 transactions atteinte. Débloquez l'illimité avec le Premium !",
      );
    }

    let category: Category | null = null;
    if (createExpenseDto.categoryId) {
      category = await this.categoryRepository.findOne({
        where: { id: createExpenseDto.categoryId },
      });
      if (!category) throw new NotFoundException('Catégorie introuvable');
    }

    const expense = this.expenseRepository.create({
      ...createExpenseDto,
      isRecurring: createExpenseDto.isRecurring ?? false,
      date: new Date(createExpenseDto.date),
      user,
      category,
    });

    return await this.expenseRepository.save(expense);
  }

  /**
   * Récupère les statistiques comparatives (Mois actuel vs Mois précédent)
   * Nom de méthode synchronisé avec le contrôleur
   */
  async getComparisonStats(userId: number) {
    const now = new Date();

    const startOfCurrent = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrent = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const startOfPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrev = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
    );

    // Correction : Recherche par la relation user id
    const [currentExpenses, prevExpenses] = await Promise.all([
      this.expenseRepository.find({
        where: {
          user: { id: userId },
          date: Between(startOfCurrent, endOfCurrent),
        },
      }),
      this.expenseRepository.find({
        where: { user: { id: userId }, date: Between(startOfPrev, endOfPrev) },
      }),
    ]);

    const calculateTotals = (list: Expense[]) => {
      return list.reduce(
        (acc, curr) => {
          const amount = Math.abs(Number(curr.amount));
          // Correction : Utilisation des minuscules pour correspondre à ton type d'entité
          if (curr.type === 'expense') acc.totalExpense += amount;
          else acc.totalIncome += amount;
          return acc;
        },
        { totalExpense: 0, totalIncome: 0 },
      );
    };

    const current = calculateTotals(currentExpenses);
    const prev = calculateTotals(prevExpenses);

    // Correction UX : Évite le faux 100% si le mois précédent est vide
    const calculateVariation = (curr: number, old: number) => {
      if (old === 0) return 0;
      return ((curr - old) / old) * 100;
    };

    return {
      currentMonth: {
        ...current,
        balance: current.totalIncome - current.totalExpense,
      },
      previousMonth: { ...prev, balance: prev.totalIncome - prev.totalExpense },
      variations: {
        expense: calculateVariation(current.totalExpense, prev.totalExpense),
        income: calculateVariation(current.totalIncome, prev.totalIncome),
      },
    };
  }

  /**
   * Nom de méthode synchronisé avec le contrôleur (findByUser)
   */
  async findByUser(userId: number): Promise<Expense[]> {
    return await this.expenseRepository.find({
      where: { user: { id: userId } },
      relations: ['category'],
      order: { date: 'DESC' },
    });
  }

  async findOne(id: number, userId: number): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['category'],
    });

    if (!expense) throw new NotFoundException(`Transaction introuvable`);
    return expense;
  }

  async update(
    id: number,
    userId: number,
    dto: UpdateExpenseDto,
  ): Promise<Expense> {
    const expense = await this.findOne(id, userId);

    if (dto.label !== undefined) expense.label = dto.label;
    if (dto.amount !== undefined) expense.amount = dto.amount;
    if (dto.date !== undefined) expense.date = new Date(dto.date);
    if (dto.type !== undefined) expense.type = dto.type;
    if (dto.isRecurring !== undefined) expense.isRecurring = dto.isRecurring;

    if (dto.categoryId !== undefined) {
      if (dto.categoryId === null) {
        expense.category = null;
      } else {
        const category = await this.categoryRepository.findOne({
          where: { id: dto.categoryId },
        });
        if (!category) throw new NotFoundException('Catégorie introuvable');
        expense.category = category;
      }
    }

    return await this.expenseRepository.save(expense);
  }

  async remove(id: number, userId: number): Promise<void> {
    const expense = await this.findOne(id, userId);
    await this.expenseRepository.remove(expense);
  }
}
