import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './entity/user.entity';
import * as argon2 from 'argon2';

// ✅ Mock complet d'Argon2 pour éviter les erreurs de compilation native
jest.mock('argon2');

describe('UserService', () => {
  let service: UserService;
  let repo: Repository<User>;

  // ✅ Mock du Repository TypeORM
  const mockUserRepository = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    // Mock pour findByEmail qui utilise QueryBuilder
    createQueryBuilder: jest.fn(() => ({
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repo = module.get<Repository<User>>(getRepositoryToken(User));

    // ✅ Nettoyage des mocks entre chaque test
    jest.clearAllMocks();
  });

  describe('getProfileWithBalance()', () => {
    it('devrait calculer correctement le solde (addition des montants)', async () => {
      const mockUser = {
        id: 1,
        email: 'test@test.com',
        expenses: [{ amount: 1500 }, { amount: -500 }], // Solde attendu: 1000
      } as any;
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getProfileWithBalance(1);

      expect(result.totalBalance).toBe(1000);
      expect(result.password).toBeUndefined(); // Sécurité : password supprimé
    });

    it('devrait lancer une NotFoundException si l utilisateur n existe pas', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(service.getProfileWithBalance(99)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create()', () => {
    it('devrait hacher le mot de passe et sauvegarder', async () => {
      const dto = {
        email: 'a@b.com',
        password: 'plain',
        firstName: 'A',
        lastName: 'B',
        birthDate: '1990-01-01',
      } as any;
      (argon2.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockUserRepository.create.mockReturnValue(dto);
      mockUserRepository.save.mockResolvedValue({
        id: 1,
        ...dto,
        password: 'hashed_password',
      });

      const result = await service.create(dto);

      expect(argon2.hash).toHaveBeenCalledWith('plain');
      expect(result.password).toBe('hashed_password');
    });
  });

  describe('update()', () => {
    it('devrait mettre à jour et hacher le mot de passe si fourni', async () => {
      const existingUser = { id: 1, firstName: 'Old' } as User;
      mockUserRepository.findOne.mockResolvedValue(existingUser);
      (argon2.hash as jest.Mock).mockResolvedValue('new_hash');
      mockUserRepository.save.mockImplementation((user) =>
        Promise.resolve(user),
      );

      const result = await service.update(1, {
        password: 'new_password',
        firstName: 'New',
      });

      expect(result.firstName).toBe('New');
      expect(argon2.hash).toHaveBeenCalledWith('new_password');
      expect(mockUserRepository.save).toHaveBeenCalled();
    });
  });

  describe('updatePremiumStatus()', () => {
    it('devrait mettre à jour le statut premium via findOne et save', async () => {
      // 1. On simule l'utilisateur trouvé
      const existingUser = {
        id: 1,
        email: 'test@test.com',
        isPremium: false,
      } as User;
      mockUserRepository.findOne.mockResolvedValue(existingUser);

      // 2. On simule le save (ce que fait ton code réel)
      mockUserRepository.save.mockResolvedValue({
        ...existingUser,
        isPremium: true,
      });

      // Exécution
      await service.updatePremiumStatus(1, true);

      // 3. Vérifications
      // On vérifie que findOne a été appelé par la logique interne
      expect(mockUserRepository.findOne).toHaveBeenCalled();

      // On vérifie que save a bien été appelé avec l'objet modifié
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          isPremium: true,
        }),
      );
    });

    it('devrait lancer une NotFoundException si l utilisateur n existe pas', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.updatePremiumStatus(99, true)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove()', () => {
    it('devrait supprimer ou lancer NotFoundException', async () => {
      // Cas succès
      mockUserRepository.delete.mockResolvedValue({ affected: 1 });
      await expect(service.remove(1)).resolves.toBeUndefined();

      // Cas échec
      mockUserRepository.delete.mockResolvedValue({ affected: 0 });
      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });
  });
});
