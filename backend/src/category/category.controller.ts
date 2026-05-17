import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  NotFoundException,
  BadRequestException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './DTO/create-category.dto';
import { UpdateCategoryDto } from './DTO/update-category.dto';
import { JwtAuthGuard } from '../auth/JWT/jwt-auth.guard';
import { User } from '../user/entity/user.entity';

@Controller('categories')
@UseGuards(JwtAuthGuard) // Applique le garde à toutes les routes de ce contrôleur
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // Création d'une catégorie sécurisée par utilisateur
  @Post()
  async create(@Body() dto: CreateCategoryDto, @Req() req: Request) {
    try {
      // On passe le DTO et l'utilisateur connecté extrait du JWT
      const newCategory = await this.categoryService.create(
        dto,
        req.user as User,
      );
      return newCategory;
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to create category',
      );
    }
  }

  // Récupère toutes les catégories (par défaut et de l'utilisateur connecté)
  @Get()
  async findAll(@Req() req: Request) {
    const user = req.user as User;
    return this.categoryService.findAllForUser(user);
  }

  // Récupérer une catégorie spécifique avec vérification d'accès
  @Get(':id')
  async findOne(@Param('id') id: number, @Req() req: Request) {
    try {
      // Ajout du second argument 'user' requis par le service
      const category = await this.categoryService.findOne(id, req.user as User);
      return category;
    } catch (error) {
      throw new NotFoundException(error.message || 'Category not found');
    }
  }

  // Mettre à jour une catégorie appartenant à l'utilisateur
  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdateCategoryDto,
    @Req() req: Request,
  ) {
    try {
      // Ajout de l'utilisateur pour la validation de propriété (Sécurité IDOR)
      const updatedCategory = await this.categoryService.update(
        id,
        dto,
        req.user as User,
      );
      return updatedCategory;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new NotFoundException(error.message || 'Category not found');
    }
  }

  // Supprimer une catégorie appartenant à l'utilisateur
  @Delete(':id')
  async remove(@Param('id') id: number, @Req() req: Request) {
    try {
      // Ajout de l'utilisateur pour autoriser la suppression
      await this.categoryService.remove(id, req.user as User);
      return { message: 'Category deleted successfully' };
    } catch (error) {
      throw new NotFoundException(error.message || 'Category not found');
    }
  }
}
