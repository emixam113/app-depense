import { Test, TestingModule } from '@nestjs/testing';
import { ExpenseService } from './expense.service';
import { Repository } from 'typeorm';
import { Expense } from './entity/expense.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

describe('ExpenseService', () => {
  let service: ExpenseService;
  let repo: Repository<Expense>;

  const mockExpense: Expense = {
    id: 1,
    label: 'Test Expense',
    amount: 100,
    date: new Date('2023-01-01'),
    type: 'expense',
    user: { id: 1, email: 'test@test.com' } as any,
    category: { id: 1, name: 'Test Category' } as any,
  };

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpenseService,
        {
          provide: getRepositoryToken(Expense),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<ExpenseService>(ExpenseService);
    repo = module.get<Repository<Expense>>(getRepositoryToken(Expense));

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and save a new expense', async () => {
      const dto: CreateExpenseDto = {
        label: 'Test Expense',
        amount: 100,
        date: '2023-01-01T00:00:00.000Z',
        type: 'expense',
        userId: 1,
        categoryId: 1,
      };

      mockRepo.create.mockReturnValue(mockExpense);
      mockRepo.save.mockResolvedValue(mockExpense);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalledWith(mockExpense);
      expect(result).toEqual(mockExpense);
    });
  });

  describe('findAll', () => {
    it('should return an array of expenses', async () => {
      mockRepo.find.mockResolvedValue([mockExpense]);

      const result = await service.findAll();

      expect(repo.find).toHaveBeenCalled();
      expect(result).toEqual([mockExpense]);
    });
  });

  describe('findOne', () => {
    it('should return the expense when found', async () => {
      mockRepo.findOne.mockResolvedValue(mockExpense);

      const result = await service.findOne(1);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockExpense);
    });

    it('should throw NotFoundException when expense not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneWithCategory', () => {
    it('should return the expense with category', async () => {
      mockRepo.findOne.mockResolvedValue(mockExpense);

      const result = await service.findOneWithCategory(1);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['category', 'user'],
      });
      expect(result).toEqual(mockExpense);
    });

    it('should throw NotFoundException when expense not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findOneWithCategory(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return the updated expense', async () => {
      const dto: UpdateExpenseDto = { label: 'Updated Label' };

      mockRepo.findOne.mockResolvedValue(mockExpense);
      mockRepo.save.mockResolvedValue({ ...mockExpense, ...dto });

      const result = await service.update(1, dto);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(repo.save).toHaveBeenCalledWith({ ...mockExpense, ...dto });
      expect(result.label).toBe('Updated Label');
    });

    it('should throw NotFoundException if expense to update does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.update(999, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove the expense', async () => {
      mockRepo.findOne.mockResolvedValue(mockExpense);
      mockRepo.delete.mockResolvedValue({ affected: 1 });

      await service.remove(1);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(repo.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if expense to remove does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
