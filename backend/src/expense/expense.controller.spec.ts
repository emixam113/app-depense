import { Test, TestingModule } from '@nestjs/testing';
import { ExpenseController } from './expense.controller';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Expense } from './entity/expense.entity';
import { NotFoundException } from '@nestjs/common';

describe('ExpenseController', () => {
  let controller: ExpenseController;
  let service: ExpenseService;

  const mockExpense: Expense = {
    id: 1,
    label: 'Test Expense',
    amount: 100,
    date: new Date(),
    user: { id: 1, email: 'test@test.com' } as any,
    category: { id: 1, name: 'Test Category' } as any,
  };

  const mockExpenseService = {
    create: jest.fn().mockResolvedValue(mockExpense),
    findAll: jest.fn().mockResolvedValue([mockExpense]),
    findOne: jest.fn().mockResolvedValue(mockExpense),
    update: jest.fn().mockResolvedValue({ ...mockExpense, label: 'Updated Expense' }),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExpenseController],
      providers: [
        {
          provide: ExpenseService,
          useValue: mockExpenseService,
        },
      ],
    }).compile();

    controller = module.get<ExpenseController>(ExpenseController);
    service = module.get<ExpenseService>(ExpenseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new expense', async () => {
      const createExpenseDto: CreateExpenseDto = {
        label: 'Test Expense',
        amount: 100,
        date: new Date().toISOString(),
        userId: 1,
        categoryId: 1,
      };

      const result = await controller.create(createExpenseDto);
      
      expect(service.create).toHaveBeenCalledWith(createExpenseDto);
      expect(result).toEqual(mockExpense);
    });
  });

  describe('findAll', () => {
    it('should return an array of expenses', async () => {
      const result = await controller.findAll();
      
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockExpense]);
    });
  });

  describe('findOne', () => {
    it('should return a single expense by id', async () => {
      const result = await controller.findOne(1);
      
      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockExpense);
    });

    it('should throw NotFoundException when expense is not found', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValueOnce(new NotFoundException());
      
      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an expense', async () => {
      const updateExpenseDto: UpdateExpenseDto = {
        label: 'Updated Expense',
      };

      const result = await controller.update(1, updateExpenseDto);
      
      expect(service.update).toHaveBeenCalledWith(1, updateExpenseDto);
      expect(result.label).toBe('Updated Expense');
    });

    it('should throw NotFoundException when updating non-existent expense', async () => {
      jest.spyOn(service, 'update').mockRejectedValueOnce(new NotFoundException());
      
      await expect(controller.update(999, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove an expense', async () => {
      await controller.remove(1);
      
      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when removing non-existent expense', async () => {
      jest.spyOn(service, 'remove').mockRejectedValueOnce(new NotFoundException());
      
      await expect(controller.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
