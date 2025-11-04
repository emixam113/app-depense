import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { MailService } from '../mail/mail.service';
import { ResetTokenService } from './reset-token.service';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';

jest.mock('argon2', () => ({
  hash: jest.fn(),
  verify: jest.fn(),
}));

describe('AuthService (Unit)', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let mailService: jest.Mocked<MailService>;
  let resetTokenService: jest.Mocked<ResetTokenService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            updatePassword: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendPasswordResetEmail: jest.fn(),
          },
        },
        {
          provide: ResetTokenService,
          useValue: {
            createToken: jest.fn(),
            findValidToken: jest.fn(),
            markAsUsed: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    mailService = module.get(MailService);
    resetTokenService = module.get(ResetTokenService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // 🧾 LOGIN
  describe('login', () => {
    const user = {
      id: 1,
      email: 'test@test.com',
      password: 'hashedPassword',
      firstName: 'John',
      lastName: 'Doe',
      birthDate: new Date(),
      expenses: [],
      methods: [],
      resetTokens: [],
      categories: [],
    };

    it(' devrait renvoyer un token si la connexion réussit', async () => {
      userService.findByEmail.mockResolvedValue(user as any);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('fake-token');

      const result = await service.login('test@test.com', 'password123');

      expect(result).toEqual({
        message: 'Connexion réussie',
        access_token: 'fake-token',
        user,
      });
      expect(userService.findByEmail).toHaveBeenCalledWith('test@test.com');
      expect(argon2.verify).toHaveBeenCalledWith(user.password, 'password123');
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: user.id, email: user.email });
    });

    it(' devrait lever une NotFoundException si utilisateur non trouvé', async () => {
      userService.findByEmail.mockResolvedValue(null);

      await expect(service.login('unknown@test.com', '123')).rejects.toThrow(NotFoundException);
    });

    it(' devrait lever une BadRequestException si le mot de passe est incorrect', async () => {
      userService.findByEmail.mockResolvedValue(user as any);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.login('test@test.com', 'wrong')).rejects.toThrow(BadRequestException);
    });
  });

  // 🆕 SIGNUP
  describe('signup', () => {
    const dto = {
      email: 'new@test.com',
      password: 'password123',
      confirmPassword: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it(' devrait créer un utilisateur avec un mot de passe hashé', async () => {
      (argon2.hash as jest.Mock).mockResolvedValue('hashed');
      userService.create.mockResolvedValue({ id: 1, ...dto } as any);

      const result = await service.signup(dto);

      expect(argon2.hash).toHaveBeenCalledWith('password123');
      expect(userService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: dto.email,
          password: dto.password,
          firstName: dto.firstName,
          lastName: dto.lastName,
        }),
      );
      expect(result).toHaveProperty('message', 'Utilisateur créé avec succès');
    });

    it(' devrait lever une BadRequestException si les mots de passe ne correspondent pas', async () => {
      const invalidDto = { ...dto, confirmPassword: 'different' };

      await expect(service.signup(invalidDto)).rejects.toThrow(BadRequestException);
      expect(userService.create).not.toHaveBeenCalled();
    });
  });

  // ✉️ FORGOT PASSWORD
  describe('forgotPassword', () => {
    it('devrait créer un token et envoyer un email', async () => {
      const user = {
        id: 1,
        email: 'test@test.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'pass',
        birthDate: new Date(),
        expenses: [],
        methods: [],
        resetTokens: [],
        categories: [],
      };
      userService.findByEmail.mockResolvedValue(user as any);
      resetTokenService.createToken.mockResolvedValue({ code: '123456' } as any);

      const result = await service.forgotPassword('test@test.com');

      expect(resetTokenService.createToken).toHaveBeenCalledWith(user);
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        user.email,
        '123456',
        user.firstName,
      );
      expect(result).toEqual({
        message: 'Code de réinitialisation envoyé à votre adresse email.',
        success: true,
      });
    });

    it(' devrait lever NotFoundException si utilisateur inexistant', async () => {
      userService.findByEmail.mockResolvedValue(null);

      await expect(service.forgotPassword('nope@test.com')).rejects.toThrow(NotFoundException);
    });
  });

  // 🔑 RESET PASSWORD
  describe('resetPassword', () => {
    it('devrait réinitialiser le mot de passe si le code est valide', async () => {
      const user = {
        id: 1,
        email: 'test@test.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'old',
        birthDate: new Date(),
        expenses: [],
        methods: [],
        resetTokens: [],
        categories: [],
      };
      const token = {
        id: 1,
        code: '123456',
        used: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
        user,
      };
      userService.findByEmail.mockResolvedValue(user as any);
      resetTokenService.findValidToken.mockResolvedValue(token as any);
      (argon2.hash as jest.Mock).mockResolvedValue('newHashed');

      const result = await service.resetPassword('test@test.com', '123456', 'newPass');

      expect(argon2.hash).toHaveBeenCalledWith('newPass');
      expect(userService.updatePassword).toHaveBeenCalledWith(user.id.toString(), 'newHashed');
      expect(resetTokenService.markAsUsed).toHaveBeenCalledWith(token);
      expect(result).toEqual({
        message: 'Mot de passe réinitialisé avec succès.',
        success: true,
      });
    });

    it('devrait lever BadRequestException si le code est invalide', async () => {
      const user = {
        id: 1,
        email: 'test@test.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'old',
        birthDate: new Date(),
        expenses: [],
        methods: [],
        resetTokens: [],
        categories: [],
      };
      userService.findByEmail.mockResolvedValue(user as any);
      resetTokenService.findValidToken.mockResolvedValue(null);

      await expect(
        service.resetPassword('test@test.com', 'badcode', 'newPass'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
