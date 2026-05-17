import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { UserService } from '../user/user.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let userService: UserService;

  // Simulation du UserService
  const mockUserService = {
    updatePremiumStatus: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    userService = module.get<UserService>(UserService);

    // ✅ Nettoyer l'historique des appels entre chaque test pour éviter les faux échecs
    jest.clearAllMocks();
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  it('devrait traiter correctement un événement de TEST', async () => {
    const loggerSpy = jest.spyOn((service as any).logger, 'log');
    await service.handleWebhookEvent('TEST', '1');

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('TEST reçu'),
    );
    expect(userService.updatePremiumStatus).not.toHaveBeenCalled();
  });

  it('devrait activer le Premium en cas de RENEWAL', async () => {
    await service.handleWebhookEvent('RENEWAL', '123');
    expect(userService.updatePremiumStatus).toHaveBeenCalledWith(123, true);
  });

  it('devrait désactiver le Premium en cas d’EXPIRATION', async () => {
    await service.handleWebhookEvent('EXPIRATION', '456');
    expect(userService.updatePremiumStatus).toHaveBeenCalledWith(456, false);
  });

  it('devrait ignorer le traitement si l’ID utilisateur n’est pas numérique', async () => {
    const errorSpy = jest.spyOn((service as any).logger, 'error');
    await service.handleWebhookEvent('RENEWAL', 'abc');

    expect(errorSpy).toHaveBeenCalled();
    // Grâce au clearAllMocks, ce test ne verra pas les appels des tests précédents
    expect(userService.updatePremiumStatus).not.toHaveBeenCalled();
  });
});
