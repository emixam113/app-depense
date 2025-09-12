import { Test, TestingModule } from '@nestjs/testing';
import { ExpenseService } from './expense.service';
import { Expense } from './entity/expense.entity';
import { User } from '../user/entity/user.entity';
import { Category } from '../category/entity/category.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

describe('ExpenseService', () => {
  let service: ExpenseService;

  let expenseRepo: jest.Mocked<Repository<Expense>>;
  let userRepo: jest.Mocked<Repository<User>>;
  let categoryRepo: jest.Mocked<Repository<Category>>;

  const mockUser: User = { id: 1, email: 'user@test.com' } as User;
  const mockCategory: Category = { id: 1, name: 'category', expenses: [] } as Category;
  const mockExpense: Expense = {
    id: 1,
    label: 'Food',
    amount: 20,
    date: new Date('2024-01-01'),
    type: 'expense',
    user: mockUser,
    category: mockCategory,
  } as Expense;

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
            findOneBy: jest.fn(),
            preload: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOneBy: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Category),
          useValue: {
            findOneBy: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ExpenseService>(ExpenseService);
    expenseRepo = module.get(getRepositoryToken(Expense));
    userRepo = module.get(getRepositoryToken(User));
    categoryRepo = module.get(getRepositoryToken(Category));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an expense with user and category', async () => {
      const dto: CreateExpenseDto = {
        label: 'Food',
        amount: 20,
        date: '2024-01-01',
        type: 'expense',
        userId: 1,
        categoryId: 1,
      };

      userRepo.findOneBy.mockResolvedValue(mockUser);
      categoryRepo.findOneBy.mockResolvedValue(mockCategory);
      expenseRepo.create.mockReturnValue(mockExpense);
      expenseRepo.save.mockResolvedValue(mockExpense);

      const result = await service.create(dto);

      expect(result).toEqual(mockExpense);
      expect(userRepo.findOneBy).toHaveBeenCalledWith({ id: dto.userId });
      expect(categoryRepo.findOneBy).toHaveBeenCalledWith({ id: dto.categoryId });
      expect(expenseRepo.create).toHaveBeenCalledWith({
        ...dto,
        user: mockUser,
        category: mockCategory,
      });
      expect(expenseRepo.save).toHaveBeenCalledWith(mockExpense);
    });

    it('should throw if user not found', async () => {
      userRepo.findOneBy.mockResolvedValue(null);
      const dto: CreateExpenseDto = {
        label: 'Food',
        amount: 20,
        date: '2024-01-01',
        type: 'expense',
        userId: 999,
        categoryId: 1,
      };
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw if category not found', async () => {
      userRepo.findOneBy.mockResolvedValue(mockUser);
      categoryRepo.findOneBy.mockResolvedValue(null);
      const dto: CreateExpenseDto = {
        label: 'Food',
        amount: 20,
        date: '2024-01-01',
        type: 'expense',
        userId: 1,
        categoryId: 999,
      };
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all expenses with relations', async () => {
      expenseRepo.find.mockResolvedValue([mockExpense]);
      const result = await service.findAll();
      expect(result).toEqual([mockExpense]);
      expect(expenseRepo.find).toHaveBeenCalledWith({ relations: ['user', 'category'] });
    });
  });

  describe('findOne', () => {
    it('should return a single expense by id', async () => {
      expenseRepo.findOne.mockResolvedValue(mockExpense);
      const result = await service.findOne(1);
      expect(result).toEqual(mockExpense);
    });

    it('should throw if expense not found', async () => {
      expenseRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an expense label', async () => {
      const dto: UpdateExpenseDto = { label: 'Updated' };

      expenseRepo.preload.mockResolvedValue({ ...mockExpense, label: 'Updated' });
      expenseRepo.save.mockResolvedValue({ ...mockExpense, label: 'Updated' });

      const result = await service.update(1, dto);
      expect(result.label).toBe('Updated');
      expect(expenseRepo.preload).toHaveBeenCalledWith({ id: 1, ...dto });
      expect(expenseRepo.save).toHaveBeenCalled();
    });

    it('should update the user if userId is provided', async () => {
      const dto: UpdateExpenseDto = { userId: 1 };

      expenseRepo.preload.mockResolvedValue({ ...mockExpense });
      userRepo.findOneBy.mockResolvedValue(mockUser);
      expenseRepo.save.mockResolvedValue(mockExpense);

      const result = await service.update(1, dto);
      expect(result.user).toEqual(mockUser);
      expect(userRepo.findOneBy).toHaveBeenCalledWith({ id: dto.userId });
    });

    it('should update the category if categoryId is provided', async () => {
      const newCategory: Category = { id: 2, name: 'NewCat', expenses: [] } as Category;
      const dto: UpdateExpenseDto = { categoryId: 2 };

      expenseRepo.preload.mockResolvedValue(mockExpense);
      categoryRepo.findOneBy.mockResolvedValue(newCategory);
      expenseRepo.save.mockResolvedValue({ ...mockExpense, category: newCategory });

      const result = await service.update(1, dto);
      expect(result.category).toEqual(newCategory);
      expect(categoryRepo.findOneBy).toHaveBeenCalledWith({ id: 2 });
    });

    it('should throw if expense not found', async () => {
      expenseRepo.preload.mockResolvedValue(null);
      await expect(service.update(999, {})).rejects.toThrow(NotFoundException);
    });

    it('should throw if user not found when updating userId', async () => {
      const dto: UpdateExpenseDto = { userId: 999 };
      expenseRepo.preload.mockResolvedValue(mockExpense);
      userRepo.findOneBy.mockResolvedValue(null);
      await expect(service.update(1, dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw if category not found when updating categoryId', async () => {
      const dto: UpdateExpenseDto = { categoryId: 999 };
      expenseRepo.preload.mockResolvedValue(mockExpense);
      categoryRepo.findOneBy.mockResolvedValue(null);
      await expect(service.update(1, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove an expense', async () => {
      expenseRepo.findOneBy.mockResolvedValue(mockExpense);
      expenseRepo.remove.mockResolvedValue(undefined);
      await service.remove(1);
      expect(expenseRepo.remove).toHaveBeenCalledWith(mockExpense);
    });

    it('should throw if expense not found', async () => {
      expenseRepo.findOneBy.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneWithCategory', () => {
    it('should return an expense with category relation', async () => {
      expenseRepo.findOne.mockResolvedValue(mockExpense);
      const result = await service.findOneWithCategory(1);
      expect(result).toEqual(mockExpense);
      expect(expenseRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['category'],
      });
    });
  });
});