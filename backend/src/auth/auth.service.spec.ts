import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';

import { AuthService } from './auth.service';
import { User } from '../user/entity/user.entity';
import { SignupDTO } from './DTO/Signup.dto';
import { LoginDto } from './DTO/login.dto';
import { ResetPasswordDto } from './DTO/reset-password.dto';
import { MailService } from '../mail/mail.service';
import { ResetTokenService } from './reset-token.service';
import { UserService } from '../user/user.service';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  let mailService: MailService;
  let resetTokenService: ResetTokenService;
  let userService: UserService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('jwt-token'),
    signAsync: jest.fn().mockResolvedValue('jwt-token'),
  };

  const mockMailService = {
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  };

  const mockResetTokenService = {
    generateToken: jest.fn(),
    validateToken: jest.fn(),
    markAsUsed: jest.fn(),
  };

  const mockUserService = {
    updatePassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: ResetTokenService,
          useValue: mockResetTokenService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
    mailService = module.get<MailService>(MailService);
    resetTokenService = module.get<ResetTokenService>(ResetTokenService);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    const signupDTO: SignupDTO = {
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      firstName: 'Test',
      lastName: 'User',
      birthDate: '2000-01-01',
    };

    it('should successfully sign up a new user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({
        ...signupDTO,
        id: 1,
        password: 'hashedPassword',
      });
      mockUserRepository.save.mockResolvedValue({
        id: 1,
        email: signupDTO.email,
        password: 'hashedPassword',
      });
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.signup(signupDTO);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: signupDTO.email } });
      expect(userRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        email: signupDTO.email,
        firstName: signupDTO.firstName,
        lastName: signupDTO.lastName,
      }));
      expect(userRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('access_token', 'jwt-token');
    });

    it('should throw an error if passwords do not match', async () => {
      await expect(
        service.signup({ ...signupDTO, confirmPassword: 'different' })
      ).rejects.toThrow('Passwords are not the same');
    });

    it('should throw an error if user already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue({ email: signupDTO.email });

      await expect(service.signup(signupDTO)).rejects.toThrow('User already exists');
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should return a JWT token on successful login', async () => {
      const mockUser = {
        id: 1,
        email: loginDto.email,
        password: await argon2.hash(loginDto.password),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(loginDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email },
        select: ['id', 'email', 'password', 'firstName', 'lastName'],
      });
      expect(result).toHaveProperty('access_token', 'jwt-token');
    });

    it('should throw an error if user is not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow('Identifiants invalides');
    });

    it('should throw an error if password is invalid', async () => {
      const mockUser = {
        id: 1,
        email: loginDto.email,
        password: await argon2.hash('wrong-password'),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.login(loginDto)).rejects.toThrow('Identifiants invalides');
    });
  });

  describe('resetPassword', () => {
    const resetPasswordDto: ResetPasswordDto = {
      token: 'valid-token',
      newPassword: 'newPassword123',
      email: 'test@example.com',
    };

    const mockResetToken = {
      id: 1,
      token: 'valid-token',
      used: false,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      user: { id: 1, email: 'test@example.com' },
    };

    it('should reset password successfully', async () => {
      mockResetTokenService.validateToken.mockResolvedValue(mockResetToken);
      mockUserService.updatePassword.mockResolvedValue({ id: 1, email: 'test@example.com' });

      const result = await service.resetPassword(resetPasswordDto);

      expect(resetTokenService.validateToken).toHaveBeenCalledWith(
        resetPasswordDto.token,
        resetPasswordDto.email
      );
      expect(userService.updatePassword).toHaveBeenCalledWith(
        resetPasswordDto.email,
        resetPasswordDto.newPassword
      );
      expect(resetTokenService.markAsUsed).toHaveBeenCalledWith(mockResetToken);
      expect(result).toEqual({
        success: true,
        message: 'Mot de passe réinitialisé avec succès',
      });
    });

    it('should return error for invalid or expired token', async () => {
      mockResetTokenService.validateToken.mockResolvedValue(null);

      const result = await service.resetPassword(resetPasswordDto);

      expect(result).toEqual({
        success: false,
        message: 'Lien de réinitialisation invalide ou expiré',
      });
    });

    it('should return error for already used token', async () => {
      mockResetTokenService.validateToken.mockResolvedValue({
        ...mockResetToken,
        used: true,
      });

      const result = await service.resetPassword(resetPasswordDto);

      expect(result).toEqual({
        success: false,
        message: 'Ce lien de réinitialisation a déjà été utilisé',
      });
    });
  });

  describe('requestPasswordReset', () => {
    const email = 'test@example.com';
    const birthdate = '2000-01-01';
    const mockUser = {
      id: 1,
      email,
      birthDate: new Date(birthdate),
      firstName: 'Test',
    };

    it('should send password reset email successfully', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        birthDate: new Date('2000-01-01'),
        firstName: 'Test'
      };
      
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockResetTokenService.generateToken.mockResolvedValue({
        token: 'reset-token',
        user: mockUser,
      });

      const result = await service.requestPasswordReset('test@example.com', '01-01-2000');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: ['id', 'email', 'firstName', 'birthDate'],
      });
      expect(resetTokenService.generateToken).toHaveBeenCalledWith(mockUser);
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com',
        'reset-token',
        'Test'
      );
      expect(result).toEqual({
        success: true,
        message: 'Si un compte avec cet email existe, un lien de réinitialisation a été envoyé',
      });
    });

    it('should handle user not found gracefully', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.requestPasswordReset('nonexistent@example.com', '01-01-2000');

      expect(result).toEqual({
        success: false,
        message: 'Une erreur est survenue lors du traitement de votre demande',
      });
    });
  });
});
