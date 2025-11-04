import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

import { UserService } from './user.service';
import { User } from './entity/user.entity';

// ✅ Fabrique un mock de Repository fraîche à chaque test
const createRepositoryMock = () => ({
  create:    jest.fn(),
  save:      jest.fn(),
  find:      jest.fn(),
  findOne:   jest.fn(),
  delete:    jest.fn(),
});

describe('UserService', () => {
  let service: UserService;
  let repo: jest.Mocked<Repository<User>>;

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
    repo = module.get(getRepositoryToken(User));
  });

  afterEach(() => jest.clearAllMocks());

  /* ------------------------------------------------------------------ */
  describe('create()', () => {
    it('crée et retourne l’utilisateur', async () => {
      const dto = { email: 'john@doe.com', password: 'pwd' } as any;
      const saved = { id: 1, ...dto } as User;

      repo.create.mockReturnValue(saved);
      repo.save.mockResolvedValue(saved);

      await expect(service.create(dto)).resolves.toEqual(saved);
      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalledWith(saved);
    });
  });

  /* ------------------------------------------------------------------ */
  describe('findAll()', () => {
    it('retourne la liste des utilisateurs', async () => {
      const list = [{ id: 1 } as User, { id: 2 } as User];
      repo.find.mockResolvedValue(list);

      await expect(service.findAll()).resolves.toEqual(list);
      expect(repo.find).toHaveBeenCalled();
    });
  });

  /* ------------------------------------------------------------------ */
  describe('findOne()', () => {
    it('retourne le user si trouvé', async () => {
      const user = { id: 1 } as User;
      repo.findOne.mockResolvedValue(user);

      await expect(service.findOne(1)).resolves.toEqual(user);
    });

    it('lance NotFoundException si non trouvé', async () => {
      repo.findOne.mockResolvedValue(undefined);

      await expect(service.findOne(42)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  /* ------------------------------------------------------------------ */
  describe('update()', () => {
    it('fusionne et sauvegarde les données', async () => {
      const user   = { id: 1, email: 'old@mail.com' } as User;
      const dto    = { email: 'new@mail.com' } as any;
      const merged = { ...user, ...dto } as User;

      jest.spyOn(service, 'findOne').mockResolvedValue(user);
      repo.save.mockResolvedValue(merged);

      await expect(service.update(1, dto)).resolves.toEqual(merged);
      expect(repo.save).toHaveBeenCalledWith(merged);
    });
  });

  /* ------------------------------------------------------------------ */
  describe('remove()', () => {
    it('supprime si affected > 0', async () => {
      repo.delete.mockResolvedValue({ affected: 1 } as any);

      await expect(service.remove(1)).resolves.toBeUndefined();
      expect(repo.delete).toHaveBeenCalledWith(1);
    });

    it('lance NotFoundException si rien supprimé', async () => {
      repo.delete.mockResolvedValue({ affected: 0 } as any);

      await expect(service.remove(1)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  /* ------------------------------------------------------------------ */
  describe('updatePassword()', () => {
    it('met à jour le mot de passe et ne retourne rien', async () => {
      const user = { id: 1, email: 'a@b.c', password: 'old' } as User;
      repo.findOne.mockResolvedValue(user);
      repo.save.mockResolvedValue({ ...user, password: 'newHashed' });

      await expect(service.updatePassword('a@b.c', 'new')).resolves.toBeUndefined();
      expect(repo.findOne).toHaveBeenCalledWith({ where: { email: 'a@b.c' } });
      expect(repo.save).toHaveBeenCalled();
    });

    it('lance NotFoundException si email inconnu', async () => {
      repo.findOne.mockResolvedValue(undefined);

      await expect(service.updatePassword('nobody@mail', 'x')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
