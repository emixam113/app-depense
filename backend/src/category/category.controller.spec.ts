import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { User } from '../user/entity/user.entity';

describe('CategoryController (Unit)', () => {
  let controller: CategoryController;
  let service: jest.Mocked<CategoryService>;

  const mockCategory = { id: 1, name: 'Test', color: '#ffffff' };
  const mockUser = { id: 42, email: 'user@test.com' } as User;

  // Simulation de l'objet Request d'Express
  const mockRequest = {
    user: mockUser,
  } as any;

  const mockService = {
    create: jest.fn().mockResolvedValue(mockCategory),
    findAllForUser: jest.fn().mockResolvedValue([mockCategory]),
    findOne: jest.fn().mockResolvedValue(mockCategory),
    update: jest.fn().mockResolvedValue({ ...mockCategory, name: 'Updated' }),
    remove: jest.fn().mockResolvedValue(undefined),
  };

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
    service = module.get(CategoryService) as jest.Mocked<CategoryService>;
    jest.clearAllMocks();
  });

  // 🟢 CREATE
  describe('create', () => {
    it('devrait créer une catégorie', async () => {
      const dto: CreateCategoryDto = { name: 'Test', color: '#ffffff' };
      const result = await controller.create(dto, mockRequest);

      expect(service.create).toHaveBeenCalledWith(dto, mockUser);
      expect(result).toEqual(mockCategory);
    });

    it('devrait lever BadRequestException si le service échoue', async () => {
      service.create.mockRejectedValue(new Error('Limite atteinte'));
      const dto: CreateCategoryDto = { name: 'Test', color: '#ffffff' };

      await expect(controller.create(dto, mockRequest)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // 🔵 FIND ALL
  describe('findAll', () => {
    it('devrait retourner toutes les catégories de l’user', async () => {
      const result = await controller.findAll(mockRequest);

      expect(service.findAllForUser).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual([mockCategory]);
    });
  });

  // 🟡 FIND ONE
  describe('findOne', () => {
    it('devrait retourner une catégorie par ID', async () => {
      const result = await controller.findOne(1, mockRequest);

      expect(service.findOne).toHaveBeenCalledWith(1, mockUser);
      expect(result).toEqual(mockCategory);
    });

    it('devrait lever NotFoundException si non trouvée', async () => {
      service.findOne.mockRejectedValue(new Error('Not found'));
      await expect(controller.findOne(99, mockRequest)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // 🟠 UPDATE
  describe('update', () => {
    it('devrait mettre à jour une catégorie', async () => {
      const dto: UpdateCategoryDto = { name: 'Updated', color: '#000000' };
      const result = await controller.update(1, dto, mockRequest);

      expect(service.update).toHaveBeenCalledWith(1, dto, mockUser);
      expect(result.name).toEqual('Updated');
    });

    it('devrait lever NotFoundException si le service échoue', async () => {
      service.update.mockRejectedValue(new Error('Unauthorized'));
      const dto: UpdateCategoryDto = { name: 'Test', color: '#000000' };

      await expect(controller.update(999, dto, mockRequest)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // 🔴 REMOVE
  describe('remove', () => {
    it('devrait supprimer une catégorie', async () => {
      const result = await controller.remove(1, mockRequest);

      expect(service.remove).toHaveBeenCalledWith(1, mockUser);
      expect(result).toEqual({ message: 'Category deleted successfully' });
    });

    it('devrait lever NotFoundException si la suppression échoue', async () => {
      service.remove.mockRejectedValue(new Error('Fail'));
      await expect(controller.remove(1, mockRequest)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
