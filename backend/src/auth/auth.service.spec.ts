import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { User } from '../user/entity/user.entity';
import { NotFoundException } from '@nestjs/common';

// 🔧 Small helper that returns a fresh mock for each test
const createRepositoryMock = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
});

describe('UserService', () => {
  let service: UserService;
  let repository: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useFactory: createRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get(getRepositoryToken(User));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create()', () => {
    it('should create and return a user', async () => {
      const dto = { email: 'john@example.com', password: 'pwd' } as any;
      const savedUser = { id: 1, ...dto } as User;

      repository.create.mockReturnValue(savedUser);
      repository.save.mockResolvedValue(savedUser);

      await expect(service.create(dto)).resolves.toEqual(savedUser);
      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(savedUser);
    });
  });

  describe('findAll()', () => {
    it('should return an array of users', async () => {
      const users = [{ id: 1 } as User, { id: 2 } as User];
      repository.find.mockResolvedValue(users);

      await expect(service.findAll()).resolves.toEqual(users);
      expect(repository.find).toHaveBeenCalled();
    });
  });

  describe('findOne()', () => {
    it('should return a user when found', async () => {
      const user = { id: 1 } as User;
      repository.findOne.mockResolvedValue(user);

      await expect(service.findOne(1)).resolves.toEqual(user);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      repository.findOne.mockResolvedValue(undefined);

      await expect(service.findOne(1)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update()', () => {
    it('should merge, save, and return the updated user', async () => {
      const user = { id: 1, email: 'old@mail.com' } as User;
      const dto = { email: 'new@mail.com' } as any;
      const merged = { ...user, ...dto } as User;

      // findOne inside service.update → returns user
      jest.spyOn(service, 'findOne').mockResolvedValue(user);
      repository.save.mockResolvedValue(merged);

      await expect(service.update(1, dto)).resolves.toEqual(merged);
      expect(repository.save).toHaveBeenCalledWith(merged);
    });
  });

  describe('remove()', () => {
    it('should call repository.delete with id', async () => {
      repository.delete.mockResolvedValue({ affected: 1 } as any);

      await expect(service.remove(1)).resolves.toBeUndefined();
      expect(repository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when nothing deleted', async () => {
      repository.delete.mockResolvedValue({ affected: 0 } as any);

      await expect(service.remove(1)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updatePassword()', () => {
    it('should update password and return user', async () => {
      const user = { id: 1, email: 'a@b.c', password: 'old' } as User;
      const updated = { ...user, password: 'new' } as User;

      repository.findOne.mockResolvedValue(user);
      repository.save.mockResolvedValue(updated);

      await expect(service.updatePassword('a@b.c', 'new')).resolves.toEqual(updated);
      expect(repository.save).toHaveBeenCalledWith(updated);
    });

    it('should throw NotFoundException when email not found', async () => {
      repository.findOne.mockResolvedValue(undefined);
      await expect(service.updatePassword('missing@mail', 'x')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});