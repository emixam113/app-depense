import { Test, TestingModule } from '@nestjs/testing';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { UserService } from '../user/user.service';
import { BadRequestException } from '@nestjs/common';
import { User } from '../user/entity/user.entity';

describe('MailController', () => {
  let controller: MailController;
  let mailService: jest.Mocked<MailService>;
  let userService: jest.Mocked<UserService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailController],
      providers: [
        {
          provide: MailService,
          useValue: {
            sendTestEmail: jest.fn(),
            sendPasswordResetEmail: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            findByEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MailController>(MailController);
    mailService = module.get(MailService);
    userService = module.get(UserService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('sendTestEmail', () => {
    it('envoie un email de test avec succès', async () => {
      mailService.sendTestEmail.mockResolvedValue({
        success: true,
        message: 'Email envoyé',
      } as any); // forçons le typage ici

      const result = await controller.sendTestEmail('test@example.com');

      expect(mailService.sendTestEmail).toHaveBeenCalledWith('test@example.com');
      expect(result).toEqual({ success: true, message: 'Email envoyé' });
    });

    it('rejette si aucun email n’est fourni', async () => {
      await expect(controller.sendTestEmail('')).rejects.toThrow(BadRequestException);
    });
  });

  describe('sendResetPassword', () => {
    it('envoie un email de réinitialisation avec succès', async () => {
      const mockUser: User = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'hashed',
        birthDate: new Date(),
        expenses: [],
        methods: [],
        resetTokens: [],
      };

      userService.findByEmail.mockResolvedValue(mockUser);
      mailService.sendPasswordResetEmail.mockResolvedValue(undefined); // correspond à Promise<void>

      const result = await controller.sendResetPassword('test@example.com');

      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        mockUser.email,
        'generated-token-here',
        mockUser.firstName,
      );
      expect(result).toEqual({
        message: 'Email de réinitialisation envoyé',
        tokenSent: 'generated-token-here',
      });
    });

    it('rejette si aucun email n’est fourni', async () => {
      await expect(controller.sendResetPassword('')).rejects.toThrow(BadRequestException);
    });

    it('rejette si l’utilisateur est introuvable', async () => {
      userService.findByEmail.mockResolvedValue(null);
      await expect(controller.sendResetPassword('unknown@example.com')).rejects.toThrow(
        'User not found',
      );
    });
  });
});
