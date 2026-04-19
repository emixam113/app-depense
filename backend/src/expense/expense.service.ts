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
    // 1. Définition des bornes du mois actuel (Heure serveur pour éviter la triche locale)
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

    // 2. Récupération de l'utilisateur et comptage des entrées du mois en cours
    const [user, count] = await Promise.all([
      this.userRepository.findOne({ where: { id: userId } }),
      this.expenseRepository.count({
        where: {
          user: { id: userId },
          date: Between(startOfMonth, endOfMonth), // Filtre mensuel strict
        },
      }),
    ]);

    if (!user) throw new NotFoundException('Utilisateur introuvable');

    // 3. Vérification du statut Premium et de la limite de 50
    if (!user.isPremium && count >= 50) {
      throw new ForbiddenException(
        "Limite mensuelle de 50 transactions atteinte. Débloquez l'illimité avec le Premium !",
      );
    }

    // 4. Gestion de la catégorie
    let category: Category | null = null;
    if (createExpenseDto.categoryId) {
      category = await this.categoryRepository.findOne({
        where: { id: createExpenseDto.categoryId },
      });
      if (!category) throw new NotFoundException('Catégorie introuvable');
    }

    // 5. Enregistrement avec le nouveau champ isRecurring
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
   * Récupère l'historique sécurisé par utilisateur
   */
  async findByUser(userId: number): Promise<Expense[]> {
    return await this.expenseRepository.find({
      where: { user: { id: userId } },
      relations: ['category'],
      order: { date: 'DESC' },
    });
  }

  /**
   * Récupère une entrée avec protection IDOR
   */
  async findOne(id: number, userId: number): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['category'],
    });

    if (!expense) {
      throw new NotFoundException(
        `Transaction introuvable ou accès non autorisé`,
      );
    }
    return expense;
  }

  /**
   * Mise à jour incluant la modification de la récurrence
   */
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
    if (dto.isRecurring !== undefined) expense.isRecurring = dto.isRecurring; // Mise à jour récurrence

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

  /**
   * Suppression sécurisée
   */
  async remove(id: number, userId: number): Promise<void> {
    const expense = await this.findOne(id, userId);
    await this.expenseRepository.remove(expense);
  }
}
