import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './entity/user.entity';
import { UpdateUserDto } from '../user/dto/update-user.dto';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  // Mock d'un utilisateur correspondant à ton entité
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
  } as User;

  const mockUserService = {
    // On mocke les 3 méthodes utilisées dans ton contrôleur
    findOne: jest.fn().mockResolvedValue(mockUser),
    update: jest.fn().mockResolvedValue({ ...mockUser, firstName: 'Updated' }),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);

    jest.clearAllMocks();
  });

  it('devrait retourner le profil de l utilisateur connecté (Get /me)', async () => {
    // Simulation de l'objet Request rempli par le JwtAuthGuard
    const mockRequest = { user: { id: 1 } } as any;

    const result = await controller.getProfile(mockRequest);

    expect(result).toEqual(mockUser);
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('devrait mettre à jour le profil de l utilisateur connecté (Patch /me)', async () => {
    const mockRequest = { user: { id: 1 } } as any;
    const dto: UpdateUserDto = { firstName: 'Updated' };

    const result = await controller.update(mockRequest, dto);

    expect(result.firstName).toEqual('Updated');
    expect(service.update).toHaveBeenCalledWith(1, dto);
  });

  it('devrait supprimer le compte de l utilisateur connecté (Delete /me)', async () => {
    const mockRequest = { user: { id: 1 } } as any;

    const result = await controller.remove(mockRequest);

    expect(result).toBeUndefined();
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
