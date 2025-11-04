import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './DTO/create-category.dto';
import { UpdateCategoryDto } from './DTO/update-category.dto';

describe('CategoryController (Unit)', () => {
  let controller: CategoryController;
  let service: jest.Mocked<CategoryService>;

  const mockCategory = { id: 1, name: 'Test', color: '#ffffff' };

  const mockService = {
    create: jest.fn().mockResolvedValue(mockCategory),
    findAllForUser: jest.fn().mockResolvedValue([mockCategory]),
    findOne: jest.fn().mockResolvedValue(mockCategory),
    update: jest.fn().mockResolvedValue({ ...mockCategory, name: 'Updated' }),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  const mockUser = { id: 42, email: 'user@test.com' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        {
          provide: CategoryService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<CategoryController>(CategoryController);
    service = module.get(CategoryService);
  });

  afterEach(() => jest.clearAllMocks());

  // 📦 CREATE
  describe('create', () => {
    it('devrait créer une catégorie', async () => {
      const dto: CreateCategoryDto = { name: 'Test', color: '#ffffff' };
      const req = { user: mockUser };

      const result = await controller.create(dto, req);

      expect(service.create).toHaveBeenCalledWith(dto, mockUser);
      expect(result).toEqual(mockCategory);
    });

    it('devrait lever BadRequestException si le service échoue', async () => {
      service.create.mockRejectedValueOnce(new Error('Erreur de création'));
      const dto: CreateCategoryDto = { name: 'Erreur', color: '#ff0000' };
      const req = { user: mockUser };

      await expect(controller.create(dto, req)).rejects.toThrow(BadRequestException);
    });
  });

  // 📜 FIND ALL
  describe('findAll', () => {
    it(' devrait retourner toutes les catégories pour un utilisateur', async () => {
      const req = { user: mockUser };
      const result = await controller.findAll(req);

      expect(service.findAllForUser).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual([mockCategory]);
    });
  });

  // 🔍 FIND ONE
  describe('findOne', () => {
    it('devrait retourner une catégorie existante', async () => {
      const result = await controller.findOne(1);
      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockCategory);
    });

    it('devrait lever NotFoundException si aucune catégorie trouvée', async () => {
      service.findOne.mockResolvedValueOnce(null);

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('devrait lever NotFoundException si le service échoue', async () => {
      service.findOne.mockRejectedValueOnce(new Error('DB Error'));

      await expect(controller.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  // ✏️ UPDATE
  describe('update', () => {
    it('devrait mettre à jour une catégorie existante', async () => {
      const dto: UpdateCategoryDto = { name: 'Updated', color: '#000000' };
      const result = await controller.update(1, dto);

      expect(service.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual({ ...mockCategory, name: 'Updated' });
    });

    it('devrait lever NotFoundException si la catégorie n’existe pas', async () => {
      service.update.mockResolvedValueOnce(null);
      const dto: UpdateCategoryDto = { name: 'Test', color: '#000000' };

      await expect(controller.update(999, dto)).rejects.toThrow(NotFoundException);
    });

    it(' devrait lever BadRequestException si le service renvoie une BadRequestException', async () => {
      service.update.mockRejectedValueOnce(new BadRequestException('Erreur de validation'));
      const dto: UpdateCategoryDto = { name: '', color: '#000000' };

      await expect(controller.update(1, dto)).rejects.toThrow(BadRequestException);
    });
  });

  // 🗑️ REMOVE
  describe('remove', () => {
    it(' devrait supprimer une catégorie', async () => {
      const result = await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual({ message: 'Category deleted successfully' });
    });

    it(' devrait lever NotFoundException si le service échoue', async () => {
      service.remove.mockRejectedValueOnce(new Error('Not found'));

      await expect(controller.remove(1)).rejects.toThrow(NotFoundException);
    });
  });
});
