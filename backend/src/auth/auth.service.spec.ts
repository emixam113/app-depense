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
            getProfileWithBalance: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: { sendPasswordResetEmail: jest.fn() },
        },
        {
          provide: ResetTokenService,
          useValue: {
            createToken: jest.fn(),
            findValidToken: jest.fn(),
            markAsUsed: jest.fn(),
          },
        },
        { provide: JwtService, useValue: { sign: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    mailService = module.get(MailService);
    resetTokenService = module.get(ResetTokenService);
    jwtService = module.get(JwtService);
  });

  describe('login', () => {
    it('devrait renvoyer un access_token si les identifiants sont corrects', async () => {
      const user = {
        id: 1,
        email: 'test@test.com',
        password: 'hashedPassword',
      };
      userService.findByEmail.mockResolvedValue(user as any);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('fake-token');

      const result = await service.login('test@test.com', 'password123');

      expect(result).toEqual({
        message: 'Connexion réussie',
        access_token: 'fake-token',
        user: { id: 1, email: 'test@test.com' },
      });
    });

    it('devrait lever NotFoundException si utilisateur inexistant', async () => {
      userService.findByEmail.mockResolvedValue(null);
      await expect(service.login('n@n.com', 'p')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('signup', () => {
    it('devrait créer un utilisateur et renvoyer un token', async () => {
      const dto = {
        email: 'a@a.com',
        password: '123',
        confirmPassword: '123',
        firstName: 'J',
        lastName: 'D',
      };
      const createdUser = {
        id: 1,
        email: 'a@a.com',
        firstName: 'J',
        lastName: 'D',
      };

      userService.create.mockResolvedValue(createdUser as any);
      jwtService.sign.mockReturnValue('token-abc');

      const result = await service.signup(dto);

      expect(userService.create).toHaveBeenCalled();
      expect(result.message).toBe('Utilisateur créé');
      expect(result.access_token).toBe('token-abc');
    });

    it('devrait lever BadRequestException si passwords différents', async () => {
      const dto = { email: 'a@a.com', password: '123', confirmPassword: '456' };
      await expect(service.signup(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('forgotPassword', () => {
    it('devrait générer un code et appeler MailService', async () => {
      const user = { id: 1, email: 'test@test.com', firstName: 'John' };
      userService.findByEmail.mockResolvedValue(user as any);
      resetTokenService.createToken.mockResolvedValue({
        code: '123456',
      } as any);

      const result = await service.forgotPassword('test@test.com');

      expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@test.com',
        '123456',
        'John',
      );
      expect(result.message).toBe('Code envoyé');
    });
  });

  describe('resetPassword', () => {
    it('devrait hasher le nouveau password et marquer le token comme utilisé', async () => {
      const user = { id: 1, email: 't@t.com' };
      const token = { id: 10, code: '123456' };

      userService.findByEmail.mockResolvedValue(user as any);
      resetTokenService.findValidToken.mockResolvedValue(token as any);
      (argon2.hash as jest.Mock).mockResolvedValue('new-hash');

      const result = await service.resetPassword(
        't@t.com',
        '123456',
        'new-pass',
      );

      expect(argon2.hash).toHaveBeenCalledWith('new-pass');
      expect(userService.updatePassword).toHaveBeenCalledWith('1', 'new-hash');
      expect(resetTokenService.markAsUsed).toHaveBeenCalledWith(token);
      expect(result.message).toBe('Mot de passe réinitialisé');
    });
  });
});
