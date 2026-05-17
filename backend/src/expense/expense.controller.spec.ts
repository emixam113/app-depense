import { Test, TestingModule } from '@nestjs/testing';
import { ExpenseController } from './expense.controller';
import { ExpenseService } from './expense.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('ExpenseController', () => {
  let controller: ExpenseController;
  let service: ExpenseService;

  const mockExpenseService = {
    create: jest.fn(),
    findOne: jest.fn(),
    findByUser: jest.fn(),
    getComparisonStats: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExpenseController],
      providers: [{ provide: ExpenseService, useValue: mockExpenseService }],
    }).compile();

    controller = module.get<ExpenseController>(ExpenseController);
    service = module.get<ExpenseService>(ExpenseService);
  });

  // --- TEST : CRÉATION AVEC QUOTA ---
  describe('create', () => {
    it('doit appeler le service et renvoyer la dépense trouvée via findOne', async () => {
      const dto = { label: 'Achat Test', amount: 20, type: 'expense' };
      const req = { user: { id: 1 } }; // Simule le JwtAuthGuard[cite: 5]

      mockExpenseService.create.mockResolvedValue({ id: 100 });
      mockExpenseService.findOne.mockResolvedValue({ id: 100, ...dto });

      const result = await controller.create(dto as any, req as any);

      expect(service.create).toHaveBeenCalledWith(dto, 1);
      expect(service.findOne).toHaveBeenCalledWith(100, 1);
      expect(result.id).toBe(100);
    });

    it('doit renvoyer une ForbiddenException si le quota mensuel est atteint', async () => {
      const req = { user: { id: 1 } };
      mockExpenseService.create.mockRejectedValue(
        new ForbiddenException('Limite atteinte'),
      );

      await expect(controller.create({} as any, req as any)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // --- TEST : SÉCURITÉ DES ROUTES PAR ID ---
  describe('PATCH /:id', () => {
    it('doit vérifier la propriété avant de mettre à jour', async () => {
      const req = { user: { id: 1 } };
      const dto = { label: 'Nouveau label' };

      // Le contrôleur appelle findOne avant update pour la sécurité
      mockExpenseService.findOne.mockResolvedValue({ id: 5 });
      mockExpenseService.update.mockResolvedValue({ id: 5, ...dto });

      await controller.update('5', dto as any, req as any);

      expect(service.findOne).toHaveBeenCalledWith(5, 1);
      expect(service.update).toHaveBeenCalledWith(5, 1, dto);
    });

    it("doit échouer si la dépense n'appartient pas à l'utilisateur", async () => {
      const req = { user: { id: 1 } };
      mockExpenseService.findOne.mockRejectedValue(new NotFoundException());

      await expect(
        controller.update('99', {} as any, req as any),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
