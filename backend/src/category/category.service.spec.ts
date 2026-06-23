import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from './entity/category.entity';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { User } from '../user/entity/user.entity';

describe('CategoryService (Unit)', () => {
  let service: CategoryService;
  let repository: jest.Mocked<Repository<Category>>;

  // Mock de l'utilisateur (on ajoute isPremium pour le test de limite)
  const mockUser = { id: 42, email: 'test@test.com', isPremium: false } as User;

  const mockCategory: Category = {
    id: 1,
    name: 'Test',
    color: '#ffffff',
    isDefault: false,
    user: mockUser,
  } as any;

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
            count: jest.fn(),
            preload: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    repository = module.get(getRepositoryToken(Category));
    jest.clearAllMocks();
  });

  // 🟢 CREATE
  describe('create', () => {
    const dto: CreateCategoryDto = { name: 'New Cat', color: '#112233' };

    it('✅ devrait créer une catégorie si la limite n’est pas atteinte', async () => {
      repository.count.mockResolvedValue(5); // 5 catégories existantes
      repository.create.mockReturnValue(mockCategory);
      repository.save.mockResolvedValue(mockCategory);

      const result = await service.create(dto, mockUser);

      expect(repository.count).toHaveBeenCalled();
      expect(result).toEqual(mockCategory);
    });

    it('❌ devrait bloquer la création si limite atteinte (10) pour non-premium', async () => {
      repository.count.mockResolvedValue(10); // Limite atteinte

      await expect(service.create(dto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // 🔵 FIND ALL
  describe('findAll', () => {
    it('✅ devrait retourner les catégories de l’utilisateur et les globales', async () => {
      repository.find.mockResolvedValue([mockCategory]);
      const result = await service.findAll(mockUser);
      expect(result).toEqual([mockCategory]);
    });
  });

  // 🟡 FIND ONE
  describe('findOne', () => {
    it('✅ devrait retourner une catégorie si elle appartient à l’user', async () => {
      repository.findOne.mockResolvedValue(mockCategory);
      const result = await service.findOne(1, mockUser);
      expect(result).toEqual(mockCategory);
    });

    it('❌ devrait lever NotFoundException si inaccessible', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.findOne(999, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // 🟠 UPDATE
  describe('update', () => {
    it('✅ devrait mettre à jour si autorisé', async () => {
      const dto: UpdateCategoryDto = { name: 'Updated' };
      repository.findOne.mockResolvedValue(mockCategory);
      repository.preload.mockResolvedValue({ ...mockCategory, ...dto } as any);
      repository.save.mockResolvedValue({ ...mockCategory, ...dto } as any);

      const result = await service.update(1, dto, mockUser);
      expect(result.name).toBe('Updated');
    });

    it('❌ devrait échouer si la catégorie n’appartient pas à l’user', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.update(1, { name: 'X' }, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // 🔴 REMOVE
  describe('remove', () => {
    it('✅ devrait supprimer si autorisé', async () => {
      repository.delete.mockResolvedValue({ affected: 1 } as any);
      await service.remove(1, mockUser);
      expect(repository.delete).toHaveBeenCalledWith({
        id: 1,
        user: { id: mockUser.id },
      });
    });

    it('❌ devrait lever NotFoundException si rien n’est supprimé', async () => {
      repository.delete.mockResolvedValue({ affected: 0 } as any);
      await expect(service.remove(1, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
