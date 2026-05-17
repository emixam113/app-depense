import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './Notification.service';
import { PushService } from './push.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../user/entity/user.entity';

describe('NotificationService', () => {
  let service: NotificationService;
  let pushService: PushService;

  const mockPushService = {
    notifyExpensesUp: jest.fn(),
    notifyBudgetExceeded: jest.fn(),
  };

  const mockUserRepository = {
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: PushService, useValue: mockPushService },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    pushService = module.get<PushService>(PushService);
  });

  describe('analyzeAndNotify', () => {
    it('devrait notifier si les dépenses augmentent de plus de 20%', async () => {
      await service.analyzeAndNotify({
        pushToken: 'token-abc',
        changeDepenses: 25, // > 20
        changeRevenus: 0,
        currentDepenses: 100,
        currentRevenus: 100,
      });

      expect(pushService.notifyExpensesUp).toHaveBeenCalledWith(
        'token-abc',
        25,
      );
    });
  });

  describe('checkAndNotifyBudget', () => {
    it('devrait notifier une alerte 80% si le budget est presque atteint', async () => {
      await service.checkAndNotifyBudget({
        pushToken: 'token-abc',
        categoryName: 'Loisirs',
        spent: 85,
        budget: 100, // 85% du budget
      });

      expect(pushService.notifyBudgetExceeded).toHaveBeenCalledWith(
        'token-abc',
        'Loisirs',
        85,
        100,
        80,
      );
    });
  });
});
