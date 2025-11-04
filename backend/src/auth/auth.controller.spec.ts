import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BadRequestException } from '@nestjs/common';

describe('AuthController (Unit)', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            signup: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  // 🔐 LOGIN
  describe('login', () => {
    it('devrait appeler AuthService.login et renvoyer le résultat', async () => {
      const dto = { email: 'test@test.com', password: '1234' };
      const expected = { message: 'Connexion réussie', token: 'jwt-token' };

      authService.login.mockResolvedValue(expected as any);

      const result = await controller.login(dto);

      expect(authService.login).toHaveBeenCalledWith(dto.email, dto.password);
      expect(result).toEqual(expected);
    });

    it('devrait lever BadRequestException si email manquant', async () => {
      const dto = { email: '', password: '1234' };
      await expect(controller.login(dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('devrait lever BadRequestException si mot de passe manquant', async () => {
      const dto = { email: 'test@test.com', password: '' };
      await expect(controller.login(dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // 🆕 SIGNUP
  describe('signup', () => {
    it('devrait appeler AuthService.signup avec le bon body', async () => {
      const dto = {
        email: 'user@test.com',
        password: 'password123',
        confirmPassword: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '2000-01-01',
      };
      const expected = { message: 'Utilisateur créé' };

      authService.signup.mockResolvedValue(expected as any);

      const result = await controller.signup(dto);

      expect(authService.signup).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  // ✉️ FORGOT PASSWORD
  describe('forgotPassword', () => {
    it('✅ devrait appeler AuthService.forgotPassword avec l’email', async () => {
      const dto = { email: 'test@test.com' };
      const expected = { message: 'Email envoyé' };

      authService.forgotPassword.mockResolvedValue(expected as any);

      const result = await controller.forgotPassword(dto);

      expect(authService.forgotPassword).toHaveBeenCalledWith(dto.email);
      expect(result).toEqual(expected);
    });

    it(' devrait lever BadRequestException si email manquant', async () => {
      const dto = { email: '' };
      await expect(controller.forgotPassword(dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // 🔑 RESET PASSWORD
  describe('resetPassword', () => {
    it(' devrait appeler AuthService.resetPassword avec les bons paramètres', async () => {
      const dto = {
        email: 'test@test.com',
        code: '123456',
        newPassword: 'newPass',
      };
      const expected = { message: 'Mot de passe réinitialisé' };

      authService.resetPassword.mockResolvedValue(expected as any);

      const result = await controller.resetPassword(dto);

      expect(authService.resetPassword).toHaveBeenCalledWith(
        dto.email,
        dto.code,
        dto.newPassword,
      );
      expect(result).toEqual(expected);
    });

    it(' devrait lever BadRequestException si un champ est manquant', async () => {
      const dto = { email: 'test@test.com', code: '', newPassword: '' };

      await expect(controller.resetPassword(dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // 👤 GET PROFILE
  describe('getProfile', () => {
    it(' devrait renvoyer req.user', () => {
      const req = { user: { id: 1, email: 'test@test.com' } } as any;

      const result = controller.getProfile(req);

      expect(result).toEqual(req.user);
    });
  });
});
