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

    // On mock les console.log/error pour éviter de polluer la console pendant les tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(mailService).toBeDefined();
  });

  describe('sendPasswordResetEmail', () => {
    it('should send reset password email with correct data', async () => {
      mockMailerService.sendMail.mockResolvedValue(true);

      const email = 'user@example.com';
      const code = '123';
      const firstName = 'Alice';

      await mailService.sendPasswordResetEmail(email, code, firstName);

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: email,
        subject: 'Réinitialisation de votre mot de passe',
        template: 'reset-password',
        context: expect.objectContaining({
          email,
          code,
          firstName,
          appName: 'Suivi des Dépenses',
        }),
      });
    });

    it('should throw and log an error if sending fails', async () => {
      const error = new Error('SMTP Error');
      mockMailerService.sendMail.mockRejectedValue(error);

      await expect(
        mailService.sendPasswordResetEmail('a@b.com', '123', 'Alice'),
      ).rejects.toThrow('SMTP Error');

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('sendTestEmail', () => {
    it('should send test email with default test data', async () => {
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
