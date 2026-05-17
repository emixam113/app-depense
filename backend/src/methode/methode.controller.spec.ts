import { Test, TestingModule } from '@nestjs/testing';
import { MethodeController } from './methode.controller';
import { MethodeService } from './methode.service';

describe('MethodeController', () => {
  let controller: MethodeController;
  let service: MethodeService;

  const mockUser = { id: 1, email: 'test@test.com' } as any;

  // Simulation du service avec les nouveaux noms de champs
  const mockMethodeService = {
    create: jest.fn().mockImplementation((dto) =>
      Promise.resolve({
        id: 1,
        income: dto.income,
        needBudget: (dto.income || 0) * 0.5,
        wantBudget: (dto.income || 0) * 0.3,
        savingBudget: (dto.income || 0) * 0.2,
      }),
    ),
    findAllForUser: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    remove: jest.fn().mockResolvedValue({ deleted: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MethodeController],
      providers: [{ provide: MethodeService, useValue: mockMethodeService }],
    }).compile();

    controller = module.get<MethodeController>(MethodeController);
    service = module.get<MethodeService>(MethodeService);
  });

  it('devrait retourner le calcul 50/30/20 via le contrôleur', async () => {
    const result = await controller.create(
      { income: 2000 },
      { user: mockUser },
    );

    expect(result).toEqual({
      id: 1,
      income: 2000,
      needBudget: 1000,
      wantBudget: 600,
      savingBudget: 400,
    });
    expect(mockMethodeService.create).toHaveBeenCalledWith(
      { income: 2000 },
      mockUser,
    );
  });
});
