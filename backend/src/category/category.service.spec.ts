import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from './entity/category.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './DTO/create-category.dto';
import { UpdateCategoryDto } from './DTO/update-category.dto';
import { User } from '../user/entity/user.entity';

describe('CategoryService (Unit)', () => {
  let service: CategoryService;
  let repository: jest.Mocked<Repository<Category>>;

  const mockCategory: Category = {
    id: 1,
    name: 'Test',
    color: '#ffffff',
    isDefault: false,
    user: null,
  } as any;

  const mockUser: User = { id: 42, email: 'test@test.com' } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: getRepositoryToken(Category),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            preload: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    repository = module.get(getRepositoryToken(Category));
  });

  afterEach(() => jest.clearAllMocks());

  // 📦 CREATE
  describe('create', () => {
    it('✅ devrait créer une catégorie pour un utilisateur', async () => {
      const dto: CreateCategoryDto = { name: 'Test', color: '#ffffff' };
      const created = { ...mockCategory, user: mockUser };

      repository.create.mockReturnValue(created as any);
      repository.save.mockResolvedValue(created as any);

      const result = await service.create(dto, mockUser);

      expect(repository.create).toHaveBeenCalledWith({
        name: dto.name,
        color: dto.color,
        isDefault: false,
        user: mockUser,
      });
      expect(repository.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
    });

    it('✅ devrait créer une catégorie globale si pas d’utilisateur', async () => {
      const dto: CreateCategoryDto = { name: 'Global', color: '#000000' };
      const created = { ...mockCategory, isDefault: true, user: null };

      repository.create.mockReturnValue(created as any);
      repository.save.mockResolvedValue(created as any);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith({
        name: dto.name,
        color: dto.color,
        isDefault: true,
        user: null,
      });
      expect(result).toEqual(created);
    });
  });

  // 📜 FIND ALL FOR USER
  describe('findAllForUser', () => {
    it('✅ devrait retourner les catégories pour un utilisateur', async () => {
      repository.find.mockResolvedValue([mockCategory]);

      const result = await service.findAllForUser(mockUser);

      expect(repository.find).toHaveBeenCalledWith({
        where: [{ isDefault: true }, { user: { id: mockUser.id } }],
        order: { name: 'ASC' },
      });
      expect(result).toEqual([mockCategory]);
    });
  });

  // 📜 FIND ALL
  describe('findAll', () => {
    it('✅ devrait retourner toutes les catégories', async () => {
      repository.find.mockResolvedValue([mockCategory]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
      expect(result).toEqual([mockCategory]);
    });
  });

  // 🔍 FIND ONE
  describe('findOne', () => {
    it('✅ devrait retourner une catégorie existante', async () => {
      repository.findOne.mockResolvedValue(mockCategory);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockCategory);
    });

    it('❌ devrait lever NotFoundException si la catégorie n’existe pas', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ✏️ UPDATE
  describe('update', () => {
    it('✅ devrait mettre à jour une catégorie existante', async () => {
      const dto: UpdateCategoryDto = { name: 'Updated', color: '#000000' };
      const updated = { ...mockCategory, ...dto };

      repository.preload.mockResolvedValue(updated as any);
      repository.save.mockResolvedValue(updated as any);

      const result = await service.update(1, dto);

      expect(repository.preload).toHaveBeenCalledWith({ id: 1, ...dto });
      expect(repository.save).toHaveBeenCalledWith(updated);
      expect(result).toEqual(updated);
    });

    it('❌ devrait lever NotFoundException si la catégorie n’existe pas', async () => {
      repository.preload.mockResolvedValue(null);

      await expect(service.update(999, { name: 'X', color: '#000' })).rejects.toThrow(NotFoundException);
    });
  });

  // 🗑️ REMOVE
  describe('remove', () => {
    it('✅ devrait supprimer une catégorie existante', async () => {
      repository.findOneBy.mockResolvedValue(mockCategory);
      repository.remove.mockResolvedValue(undefined as any);

      await service.remove(1);

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(repository.remove).toHaveBeenCalledWith(mockCategory);
    });

    it('❌ devrait lever NotFoundException si la catégorie n’existe pas', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
