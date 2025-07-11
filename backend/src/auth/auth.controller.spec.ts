import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;
  let userService: UserService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signup: jest.fn().mockResolvedValue({ success: true }),
            login: jest.fn().mockResolvedValue({ accessToken: 'fake-token' }),
            resetPassword: jest.fn().mockResolvedValue({ success: true, message: 'Mot de passe mis à jour avec succès.' }),
          },
        },
        {
          provide: UserService,
          useValue: {
            updatePassword: jest.fn().mockResolvedValue({ id: 1, email: 'test@example.com', password: 'hashed' }),
          },
        },
      ],
    }).compile();

    authController = moduleRef.get<AuthController>(AuthController);
    authService = moduleRef.get<AuthService>(AuthService);
    userService = moduleRef.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  it('should call signup with correct data', async () => {
    const dto = {
      email: 'test@example.com',
      password: 'password',
      firstName: 'Max',
      lastName: 'Royan',
      birthDate: '1999-01-01',
      confirmPassword: 'password'
    };

    const result = await authController.signup(dto);
    expect(authService.signup).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ success: true });
  });

  it('should call login with correct credentials', async () => {
    const loginDto = { email: 'test@example.com', password: 'password' };

    const result = await authController.login(loginDto);
    expect(authService.login).toHaveBeenCalledWith(loginDto);
    expect(result).toEqual({ accessToken: 'fake-token' });
  });

  it('should update password and return success message', async () => {
    const resetPasswordDto = {
      token: 'test-token',
      newPassword: 'newpass',
      email: 'test@example.com'
    };

    const result = await authController.resetPassword(resetPasswordDto);
    
    // Verify authService.resetPassword was called with the correct DTO
    expect(authService.resetPassword).toHaveBeenCalledWith(resetPasswordDto);
    // Verify the response matches what we expect
    expect(result).toEqual({ success: true, message: 'Mot de passe mis à jour avec succès.' });
  });
});
