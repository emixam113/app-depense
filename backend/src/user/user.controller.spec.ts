import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entity/user.entity';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedpassword',
    lastName: 'Doe',
    firstName: 'John',
    birthDate: new Date('1990-01-01'),
    expenses: [],
    methods: [],
    resetTokens: [],
  };

  const mockUserService = {
    create: jest.fn().mockResolvedValue(mockUser),
    findAll: jest.fn().mockResolvedValue([mockUser]),
    findOne: jest.fn().mockResolvedValue(mockUser),
    update: jest.fn().mockResolvedValue({ ...mockUser, firstName: 'UpdatedJohn' }),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a new user', async () => {
    const dto: CreateUserDto = {
      lastName: 'Doe',
      firstName: 'John',
      birthDate: '1990-01-01',
      email: 'test@example.com',
      password: 'testpass',
      confirmPassword: 'testpass',
    };

    const result = await controller.create(dto);
    expect(result).toEqual(mockUser);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should return all users', async () => {
    const result = await controller.findAll();
    expect(result).toEqual([mockUser]);
    expect(service.findAll).toHaveBeenCalled();
  });

  it('should return one user by id', async () => {
    const result = await controller.findOne(1);
    expect(result).toEqual(mockUser);
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('should update a user by id', async () => {
    const dto: UpdateUserDto = { firstName: 'UpdatedJohn' };
    const result = await controller.update(1, dto);
    expect(result.firstName).toEqual('UpdatedJohn');
    expect(service.update).toHaveBeenCalledWith(1, dto);
  });

  it('should delete a user by id', async () => {
    const result = await controller.remove(1);
    expect(result).toBeUndefined();
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});