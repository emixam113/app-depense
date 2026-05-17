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

      // On teste avec email, code (3 chiffres) et prénom
      await mailService.sendPasswordResetEmail(
        'user@example.com',
        '123',
        'Alice',
      );

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'Réinitialisation de votre mot de passe',
        template: 'reset-password',
        context: expect.objectContaining({
          email: 'user@example.com',
          code: '123',
          firstName: 'Alice',
          appName: 'Suivi des Dépenses',
        }),
      });
    });

    it('should throw an error if sending fails', async () => {
      mockMailerService.sendMail.mockRejectedValue(new Error('SMTP Error'));

      await expect(
        mailService.sendPasswordResetEmail('user@example.com', '123', 'Alice'),
      ).rejects.toThrow('SMTP Error');
    });
  });

  describe('sendTestEmail', () => {
    it('should send test email and return success response', async () => {
      mockMailerService.sendMail.mockResolvedValue(true);

      await mailService.sendTestEmail('test@example.com');

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: "Test d'envoi d'email",
        template: 'test',
        context: expect.objectContaining({
          email: 'test@example.com',
          code: '123',
          firstName: 'Test',
        }),
      });
    });
  });
});
