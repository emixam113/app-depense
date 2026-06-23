import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './Notification.service';

describe('NotificationController', () => {
  let controller: NotificationController;
  let service: NotificationService;

  const mockNotificationService = {
    savePushToken: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
    service = module.get<NotificationService>(NotificationService);
  });

  it('devrait enregistrer le token via le service', async () => {
    const dto = { pushToken: 'fake-token-123' };
    const req = { user: { id: 1 } };

    const result = await controller.registerToken(req, dto);

    expect(result).toEqual({
      success: true,
      message: 'Token push enregistré avec succès',
    });
    expect(mockNotificationService.savePushToken).toHaveBeenCalledWith(
      1,
      'fake-token-123',
    );
  });
});
