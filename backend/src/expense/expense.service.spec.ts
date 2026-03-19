import { Test, TestingModule } from '@nestjs/testing';
import { ExpenseService } from './expense.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from './entity/expense.entity';
import { User } from '../user/entity/user.entity';
import { Category } from '../category/entity/category.entity';
import { NotFoundException } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

describe('ExpenseService (Unit)', () => {
  let service: ExpenseService;
  let expenseRepository: jest.Mocked<Repository<Expense>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let categoryRepository: jest.Mocked<Repository<Category>>;

  const mockUser: User = { id: 1, email: 'user@test.com' } as any;
  const mockCategory: Category = { id: 2, name: 'Courses', color: '#ff0000' } as any;

  const mockExpense: Expense = {
    id: 10,
    label: 'Courses Carrefour',
    amount: 45.5,
    date: new Date('2025-10-01'),
    type: 'expense',
    user: mockUser,
    category: mockCategory,
    createdAt: new Date(),
    updatedAt: new Date(),
    normalizeAmount: () => {}, // ✅ méthode ajoutée
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpenseService,
        {
          provide: getRepositoryToken(Expense),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Category),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ExpenseService>(ExpenseService);
    expenseRepository = module.get(getRepositoryToken(Expense));
    userRepository = module.get(getRepositoryToken(User));
    categoryRepository = module.get(getRepositoryToken(Category));
  });

  afterEach(() => jest.clearAllMocks());

  // 🧾 CREATE
  describe('create', () => {
    it('✅ devrait créer une dépense avec utilisateur et catégorie', async () => {
      const dto: CreateExpenseDto = {
        label: 'Courses Carrefour',
        amount: 45.5,
        date: '2025-10-01',
        type: 'expense',
        categoryId: 2,
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      categoryRepository.findOne.mockResolvedValue(mockCategory);
      expenseRepository.create.mockReturnValue(mockExpense);
      expenseRepository.save.mockResolvedValue(mockExpense);

      const result = await service.create(dto, mockUser.id);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: mockUser.id } });
      expect(categoryRepository.findOne).toHaveBeenCalledWith({ where: { id: dto.categoryId } });
      expect(expenseRepository.create).toHaveBeenCalledWith({
        ...dto,
        date: new Date(dto.date),
        user: mockUser,
        category: mockCategory,
      });
      expect(result).toEqual(mockExpense);
    });

    it('❌ devrait lever NotFoundException si l’utilisateur est introuvable', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const dto = { label: 'Courses', amount: 50, date: '2025-10-01', type: 'expense' };

      await expect(service.create(dto as any, 999)).rejects.toThrow(NotFoundException);
    });

    it('❌ devrait lever NotFoundException si la catégorie est introuvable', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      categoryRepository.findOne.mockResolvedValue(null);

      const dto = { label: 'Courses', amount: 50, date: '2025-10-01', type: 'expense', categoryId: 999 };

      await expect(service.create(dto as any, 1)).rejects.toThrow(NotFoundException);
    });
  });

  // 📊 FIND BY USER
  describe('findByUser', () => {
    it('✅ devrait retourner les dépenses d’un utilisateur', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      expenseRepository.find.mockResolvedValue([mockExpense]);

      const result = await service.findByUser(mockUser.id);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: mockUser.id } });
      expect(expenseRepository.find).toHaveBeenCalledWith({
        where: { user: { id: mockUser.id } },
        relations: ['category', 'user'],
        order: { date: 'DESC' },
      });
      expect(result).toEqual([mockExpense]);
    });

    it('❌ devrait lever NotFoundException si utilisateur introuvable', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findByUser(999)).rejects.toThrow(NotFoundException);
    });
  });

  // 🔍 FIND ONE
  describe('findOne', () => {
    it('✅ devrait retourner une dépense existante', async () => {
      expenseRepository.findOne.mockResolvedValue(mockExpense);

      const result = await service.findOne(10);

      expect(expenseRepository.findOne).toHaveBeenCalledWith({
        where: { id: 10 },
        relations: ['user', 'category'],
      });
      expect(result).toEqual(mockExpense);
    });

    it('❌ devrait lever NotFoundException si la dépense n’existe pas', async () => {
      expenseRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ✏️ UPDATE
  describe('update', () => {
    it('✅ devrait mettre à jour une dépense', async () => {
      const dto: UpdateExpenseDto = {
        label: 'Courses Leclerc',
        amount: 60,
        date: '2025-10-02',
      };
      const updatedExpense: Expense = {
        ...mockExpense,
        ...dto,
        date: new Date('2025-10-02'),
        normalizeAmount: () => {}, // ✅ ajoutée aussi ici
      };

      expenseRepository.findOne.mockResolvedValue(mockExpense);
      expenseRepository.save.mockResolvedValue(updatedExpense);

      const result = await service.update(10, dto);

      expect(expenseRepository.findOne).toHaveBeenCalledWith({
        where: { id: 10 },
        relations: ['user', 'category'],
      });
      expect(expenseRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        label: 'Courses Leclerc',
        amount: 60,
        date: new Date('2025-10-02'),
      }));
      expect(result).toEqual(updatedExpense);
    });

    it('❌ devrait lever NotFoundException si la dépense n’existe pas', async () => {
      expenseRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, {})).rejects.toThrow(NotFoundException);
    });

    it('❌ devrait lever NotFoundException si la nouvelle catégorie est introuvable', async () => {
      const dto: UpdateExpenseDto = { categoryId: 99 };
      expenseRepository.findOne.mockResolvedValue(mockExpense);
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(service.update(10, dto)).rejects.toThrow(NotFoundException);
    });
  });

  // 🗑️ REMOVE
  describe('remove', () => {
    it('✅ devrait supprimer une dépense existante', async () => {
      expenseRepository.findOne.mockResolvedValue(mockExpense);
      expenseRepository.remove.mockResolvedValue(undefined as any);

      await service.remove(10);

      expect(expenseRepository.findOne).toHaveBeenCalledWith({ where: { id: 10 } });
      expect(expenseRepository.remove).toHaveBeenCalledWith(mockExpense);
    });

    it('❌ devrait lever NotFoundException si la dépense n’existe pas', async () => {
      expenseRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
