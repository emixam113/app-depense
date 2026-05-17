import { Test, TestingModule } from '@nestjs/testing';
import { ExpenseService } from './expense.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Expense } from './entity/expense.entity';
import { User } from '../user/entity/user.entity';
import { Category } from '../category/entity/category.entity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('ExpenseService', () => {
  let service: ExpenseService;
  let expenseRepo;
  let userRepo;
  let categoryRepo;

  // Mocks des Repositories
  const mockExpenseRepository = {
    count: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockCategoryRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpenseService,
        {
          provide: getRepositoryToken(Expense),
          useValue: mockExpenseRepository,
        },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepository,
        },
      ],
    }).compile();

    // ✅ CORRECTION ICI : Pas de double module.get()
    service = module.get<ExpenseService>(ExpenseService);
    expenseRepo = module.get(getRepositoryToken(Expense));
    userRepo = module.get(getRepositoryToken(User));
    categoryRepo = module.get(getRepositoryToken(Category));
  });

  describe('create (Quota Freemium)', () => {
    it('doit bloquer si quota > 50 et isPremium est false', async () => {
      // Mock : Utilisateur non-premium
      userRepo.findOne.mockResolvedValue({ id: 1, isPremium: false });
      // Mock : Déjà 50 transactions ce mois
      expenseRepo.count.mockResolvedValue(50);

      const dto = {
        label: 'Test',
        amount: 10,
        type: 'expense',
        date: new Date(),
      };

      await expect(service.create(dto as any, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('doit autoriser si quota > 50 mais isPremium est true', async () => {
      userRepo.findOne.mockResolvedValue({ id: 1, isPremium: true });
      expenseRepo.count.mockResolvedValue(60);
      expenseRepo.create.mockReturnValue({ id: 1 });
      expenseRepo.save.mockResolvedValue({ id: 1 });

      const dto = {
        label: 'Test',
        amount: 10,
        type: 'expense',
        date: new Date(),
      };
      const result = await service.create(dto as any, 1);

      expect(result).toBeDefined();
    });
  });

  describe('getComparisonStats', () => {
    it('doit calculer une variation de 100% si le mois dernier était à 0€', async () => {
      // Mock : Dépenses mois actuel = 100€, Mois précédent = 0€
      expenseRepo.find
        .mockResolvedValueOnce([{ amount: 100, type: 'expense' }])
        .mockResolvedValueOnce([]);

      const stats = await service.getComparisonStats(1);

      expect(stats.variations.expense).toBe(100); //[cite: 7]
      expect(stats.currentMonth.totalExpense).toBe(100);
    });

    it('doit calculer correctement une baisse de 50%', async () => {
      // Mois actuel 50€ vs Mois précédent 100€
      expenseRepo.find
        .mockResolvedValueOnce([{ amount: 50, type: 'expense' }])
        .mockResolvedValueOnce([{ amount: 100, type: 'expense' }]);

      const stats = await service.getComparisonStats(1);
      expect(stats.variations.expense).toBe(-50);
    });
  });

  describe('findOne & Security', () => {
    it('doit lever une NotFoundException si la transaction n’appartient pas à l’user', async () => {
      expenseRepo.findOne.mockResolvedValue(null); // Pas trouvé pour cet ID + User[cite: 7]

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });
});
