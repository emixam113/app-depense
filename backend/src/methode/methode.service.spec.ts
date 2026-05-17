import { Test, TestingModule } from '@nestjs/testing';
import { MethodeService } from './methode.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Method } from './entity/method.entity';

describe('MethodeService', () => {
  let service: MethodeService;

  const mockMethodRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest
      .fn()
      .mockImplementation((method) =>
        Promise.resolve({ id: Date.now(), ...method }),
      ),
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MethodeService,
        {
          provide: getRepositoryToken(Method),
          useValue: mockMethodRepository,
        },
      ],
    }).compile();

    service = module.get<MethodeService>(MethodeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('devrait créer et sauvegarder un calcul 50/30/20', async () => {
    const mockUser = { id: 1 } as any;
    const result = await service.create({ income: 3000 }, mockUser);

    expect(result).toMatchObject({
      income: 3000,
      needBudget: 1500,
      wantBudget: 900,
      savingBudget: 600,
    });
    expect(mockMethodRepository.save).toHaveBeenCalled();
  });
});
