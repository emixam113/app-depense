import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../category/entity/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { User } from '../user/entity/user.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  /**
   * Création sécurisée avec limite pour non-premium
   */
  async create(dto: CreateCategoryDto, user: User): Promise<Category> {
    // 1. Compter les catégories possédées par l'utilisateur (on exclut les globales)
    const userCategoriesCount = await this.categoryRepository.count({
      where: { user: { id: user.id }, isDefault: false },
    });

    // 2. Vérifier le statut Premium (bloque à 5 si non-payant)
    if (!user.isPremium && userCategoriesCount >= 5) {
      throw new BadRequestException(
        "Limite de 5 catégories atteinte. Passez à l'offre Premium pour en créer de nouvelles.",
      );
    }

    const category = this.categoryRepository.create({
      name: dto.name,
      color: dto.color,
      isDefault: false, // Une catégorie créée par un user n'est jamais globale par défaut
      user: user,
    });

    return this.categoryRepository.save(category);
  }

  /**
   * Récupère les catégories par défaut + celles de l'utilisateur
   */
  async findAllForUser(user: User): Promise<Category[]> {
    return this.categoryRepository.find({
      where: [{ isDefault: true }, { user: { id: user.id } }],
      order: { name: 'ASC' },
    });
  }

  /**
   * Récupère une catégorie spécifique (Sécurité IDOR)
   */
  async findOne(id: number, user: User): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: [
        { id, user: { id: user.id } }, // Doit lui appartenir
        { id, isDefault: true }, // OU être globale
      ],
    });

    if (!category) {
      throw new NotFoundException(`Catégorie introuvable ou accès refusé`);
    }
    return category;
  }

  /**
   * Mise à jour sécurisée (Sécurité IDOR)
   */
  async update(
    id: number,
    dto: UpdateCategoryDto,
    user: User,
  ): Promise<Category> {
    // On vérifie que la catégorie appartient bien à l'utilisateur
    const category = await this.categoryRepository.findOne({
      where: { id, user: { id: user.id } },
    });

    if (!category) {
      throw new NotFoundException(
        `Vous n'avez pas l'autorisation de modifier cette catégorie`,
      );
    }

    // On applique les modifications du dto sur l'entité existante
    const updatedCategory = await this.categoryRepository.preload({
      id: category.id,
      ...dto,
    });

    return this.categoryRepository.save(updatedCategory);
  }

  /**
   * Suppression sécurisée (Sécurité IDOR)
   */
  async remove(id: number, user: User): Promise<void> {
    // La suppression ne fonctionne que si l'ID correspond ET appartient à l'utilisateur
    const result = await this.categoryRepository.delete({
      id,
      user: { id: user.id },
    });

    if (result.affected === 0) {
      throw new NotFoundException(
        `Suppression impossible : catégorie introuvable ou non autorisée`,
      );
    }
  }

  // Gardé pour l'admin si nécessaire, mais attention à l'usage
  async findAll(mockUser: User): Promise<Category[]> {
    return this.categoryRepository.find({
      order: { name: 'ASC' },
    });
  }
}
