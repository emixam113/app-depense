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
            getProfile: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('login', () => {
    it('devrait appeler AuthService.login et renvoyer le résultat', async () => {
      const dto = { email: 'test@test.com', password: '1234' };
      const expected = {
        message: 'Connexion réussie',
        access_token: 'jwt-token',
      };

      authService.login.mockResolvedValue(expected as any);

      const result = await controller.login(dto);

      expect(authService.login).toHaveBeenCalledWith(dto.email, dto.password);
      expect(result).toEqual(expected);
    });

    it('devrait lever BadRequestException si email ou password manquant', async () => {
      await expect(
        controller.login({ email: '', password: '123' } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

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

  describe('getProfile', () => {
    it('devrait appeler authService.getProfile avec l’ID extrait du token (sub)', async () => {
      const req = { user: { sub: 1 } } as any;
      const expectedProfile = { id: 1, email: 'test@test.com', balance: 150 };

      authService.getProfile.mockResolvedValue(expectedProfile as any);

      const result = await controller.getProfile(req);

      expect(authService.getProfile).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedProfile);
    });
  });

  describe('forgotPassword', () => {
    it('devrait appeler AuthService.forgotPassword avec l’email', async () => {
      const dto = { email: 'test@test.com' };
      const expected = { message: 'Code envoyé', success: true };

      authService.forgotPassword.mockResolvedValue(expected as any);

      const result = await controller.forgotPassword(dto);

      expect(authService.forgotPassword).toHaveBeenCalledWith(dto.email);
      expect(result).toEqual(expected);
    });
  });

  describe('resetPassword', () => {
    it('devrait appeler AuthService.resetPassword avec les bons paramètres', async () => {
      const dto = {
        email: 'test@test.com',
        code: '123456',
        newPassword: 'new',
      };
      const expected = { message: 'Mot de passe réinitialisé', success: true };

      authService.resetPassword.mockResolvedValue(expected as any);

      const result = await controller.resetPassword(dto);

      expect(authService.resetPassword).toHaveBeenCalledWith(
        dto.email,
        dto.code,
        dto.newPassword,
      );
      expect(result).toEqual(expected);
    });
  });
});
