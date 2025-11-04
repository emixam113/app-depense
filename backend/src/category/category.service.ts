import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../category/entity/category.entity';
import { CreateCategoryDto } from './DTO/create-category.dto';
import { UpdateCategoryDto } from './DTO/update-category.dto';
import { User } from '../user/entity/user.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}


  async create(dto: CreateCategoryDto, user?: User): Promise<Category> {
    const category = this.categoryRepository.create({
      name: dto.name,
      color: dto.color,
      isDefault: !user, // si pas d'utilisateur -> catégorie globale
      user: user ?? null,
    });
    return this.categoryRepository.save(category);
  }


  async findAllForUser(user: User): Promise<Category[]> {
    return this.categoryRepository.find({
      where: [
        { isDefault: true },
        { user: { id: user.id } },
      ],
      order: { name: 'ASC' },
    });
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      order: { name: 'ASC' },
    });
  }


  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    return category;
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoryRepository.preload({
      id,
      ...dto,
    });
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    return this.categoryRepository.save(category);
  }


  async remove(id: number): Promise<void> {
    const category = await this.categoryRepository.findOneBy({ id });
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    await this.categoryRepository.remove(category);
  }
}
