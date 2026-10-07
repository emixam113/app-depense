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
          if (curr.type === 'expense') acc.totalExpense += amount;
          else acc.totalIncome += amount;
          return acc;
        },
        { totalExpense: 0, totalIncome: 0 },
      );
    };

    const current = calculateTotals(currentExpenses);
    const prev = calculateTotals(prevExpenses);

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
   * Récupère les transactions de l'utilisateur et génère à la volée
   * les récurrences du mois en cours si elles n'existent pas encore.
   */
  async findByUser(userId: number): Promise<Expense[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // 1. Récupérer toutes les transactions existantes de l'utilisateur
    const allExpenses = await this.expenseRepository.find({
      where: { user: { id: userId } },
      relations: ['category'],
      order: { date: 'DESC' },
    });

    // 2. Identifier les transactions récursives d'origine (des mois précédents)
    const recurringTemplates = allExpenses.filter((expense) => {
      if (!expense.isRecurring) return false;
      const expenseDate = new Date(expense.date);
      return (
        expenseDate.getFullYear() < currentYear ||
        (expenseDate.getFullYear() === currentYear &&
          expenseDate.getMonth() < currentMonth)
      );
    });

    let newlyCreatedCount = 0;

    for (const template of recurringTemplates) {
      const templateDate = new Date(template.date);
      const targetDay = templateDate.getDate();

      // Gérer les fins de mois (ex: 31 si le mois actuel n'a que 30 jours)
      const lastDayOfCurrentMonth = new Date(
        currentYear,
        currentMonth + 1,
        0,
      ).getDate();
      const actualDay = Math.min(targetDay, lastDayOfCurrentMonth);
      const targetDate = new Date(
        currentYear,
        currentMonth,
        actualDay,
        templateDate.getHours(),
        templateDate.getMinutes(),
        templateDate.getSeconds(),
      );

      // Vérifier si une transaction similaire existe déjà ce mois-ci
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

      const alreadyExists = allExpenses.some((expense) => {
        const expDate = new Date(expense.date);
        return (
          expense.label === template.label &&
          Number(expense.amount) === Number(template.amount) &&
          expDate >= startOfMonth &&
          expDate <= endOfMonth
        );
      });

      // Si elle n'existe pas encore, on la génère
      if (!alreadyExists) {
        if (!user.isPremium) {
          const currentCount = allExpenses.length + newlyCreatedCount;
          if (currentCount >= 50) {
            break;
          }
        }

        const newExpense = this.expenseRepository.create({
          label: template.label,
          amount: template.amount,
          type: template.type,
          isRecurring: true,
          date: targetDate,
          user: user,
          category: template.category,
        });

        const saved = await this.expenseRepository.save(newExpense);
        allExpenses.unshift(saved);
        newlyCreatedCount++;
      }
    }

    // Retourner la liste triée par date décroissante
    return allExpenses.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
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