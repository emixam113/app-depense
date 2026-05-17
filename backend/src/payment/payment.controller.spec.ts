import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { UserService } from '../user/user.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';

describe('PaymentController', () => {
  let controller: PaymentController;
  let userService: UserService;

  const mockUserService = {
    updatePremiumStatus: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    // Simulation de la clé secrète attendue par le webhook
    process.env.REVENUECAT_WEBHOOK_TOKEN = 'test-secret-token';

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    userService = module.get<UserService>(UserService);

    jest.clearAllMocks();
  });

  it('devrait rejeter l’accès si le token est manquant ou invalide', async () => {
    await expect(
      controller.handleRevenueCatWebhook({}, 'Bearer wrong-token'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('devrait accepter un webhook valide et activer le Premium', async () => {
    const payload = {
      event: {
        type: 'INITIAL_PURCHASE',
        app_user_id: '123',
      },
    };

    const result = await controller.handleRevenueCatWebhook(
      payload,
      'Bearer test-secret-token',
    );

    expect(result).toEqual({ received: true });
    expect(userService.updatePremiumStatus).toHaveBeenCalledWith(123, true);
  });

  it('devrait lever une BadRequest si le format du body est invalide', async () => {
    await expect(
      controller.handleRevenueCatWebhook(
        { wrong: 'format' },
        'Bearer test-secret-token',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('devrait lever une BadRequest si l’ID utilisateur est invalide', async () => {
    const payload = {
      event: {
        type: 'INITIAL_PURCHASE',
        app_user_id: 'not-a-number',
      },
    };

    await expect(
      controller.handleRevenueCatWebhook(payload, 'Bearer test-secret-token'),
    ).rejects.toThrow(BadRequestException);
  });
});
