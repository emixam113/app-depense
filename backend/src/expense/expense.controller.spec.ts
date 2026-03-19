import { Test, TestingModule } from '@nestjs/testing';
import { ExpenseController } from './expense.controller';
import { ExpenseService } from './expense.service';
import { UnauthorizedException } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Expense } from './entity/expense.entity';

describe('ExpenseController (Unit)', () => {
  let controller: ExpenseController;
  let service: jest.Mocked<ExpenseService>;

  const mockUser = {id: 1, email: 'user@test.com'};

  const mockExpense: Expense = {
    id: 10,
    label: 45.5,
    date: new Date('2025-10-01'),
    type: 'expense',
    user: mockUser as any;
    category: null,
    createdAt: new Date(),
    updateAt: new Date(),
    normalizeAmount:() => {},
  } as any.

  const mockService = {
    create: jest.fn(),
    findByUser: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExpenseController];
      providers: [
        {
          provide: ExpenseService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ExpenseController>(ExpenseController);
    service = module.get(ExpenseService);
  });

  afterEach(() => jest.clearAllMocks());

  //create:
  describe('create', () => {
    it('devrait créer une dépense et retourner un résultat complet', async () => {
        const dto: CreateExpenseDto= {
          label: 'Courses Carrefour',
          amount: 45.5,
          date: '2025-10-01',
          type: 'expense',
        };
        const req = {}
    })
  })
})