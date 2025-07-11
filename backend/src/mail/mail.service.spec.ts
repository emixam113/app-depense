import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MailerService } from '@nestjs-modules/mailer';

describe('MailService', () => {
  let mailService: MailService;
  let mailerService: MailerService;

  const mockMailerService = {
    sendMail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
    mailerService = module.get<MailerService>(MailerService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(mailService).toBeDefined();
  });

  describe('sendPasswordResetEmail', () => {
    it('should send reset password email with correct data', async () => {
      mockMailerService.sendMail.mockResolvedValue(true);

      await mailService.sendPasswordResetEmail('user@example.com', 'reset-token-123', 'Alice');

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'Réinitialisation de votre mot de passe',
        template: 'reset-password',
        context: expect.objectContaining({
          email: 'user@example.com',
          token: 'reset-token-123',
          firstName: 'Alice',
          appName: 'Suivi des Dépenses',
          currentYear: new Date().getFullYear(),
        }),
      });
    });

    it('should throw an error if mail sending fails', async () => {
      mockMailerService.sendMail.mockRejectedValue(new Error('Failed to send'));

      await expect(
        mailService.sendPasswordResetEmail('user@example.com', 'reset-token', 'Bob'),
      ).rejects.toThrow('Failed to send');
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with correct data', async () => {
      mockMailerService.sendMail.mockResolvedValue(true);

      await mailService.sendWelcomeEmail('user@example.com', 'Bob');

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'Bienvenue sur notre application de suivi des dépenses !',
        template: './welcome',
        context: {
          name: 'Bob',
        },
      });
    });
  });

  describe('sendTestEmail', () => {
    it('should send test email and return success response', async () => {
      mockMailerService.sendMail.mockResolvedValue(true);

      const result = await mailService.sendTestEmail('test@example.com');

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: "Test d'envoi d'email",
        template: 'test',
        context: expect.objectContaining({
          email: 'test@example.com',
          token: 'TEST-TOKEN-123456',
          firstName: 'Test',
          appName: 'Suivi des Dépenses',
          currentYear: new Date().getFullYear(),
        }),
      });

      expect(result).toEqual({ success: true, message: 'Email de test envoyé avec succès' });
    });

    it('should throw an error if test email fails', async () => {
      mockMailerService.sendMail.mockRejectedValue(new Error('Send error'));

      await expect(mailService.sendTestEmail('test@example.com')).rejects.toThrow('Send error');
    });
  });
});
