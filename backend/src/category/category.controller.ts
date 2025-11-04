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
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './DTO/create-category.dto';
import { UpdateCategoryDto } from './DTO/update-category.dto';
import {JwtAuthGuard} from '../auth/JWT/jwt-auth.guard';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // 📦 Création d'une catégorie
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateCategoryDto, @Req() req) {
    try {
      const newCategory = await this.categoryService.create(dto, req.user);
      return newCategory;
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to create category');
    }
  }

  // 📜 Récupérer toutes les catégories (défaut + user)
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Req() req) {
    const user = req.user;
    return this.categoryService.findAllForUser(user);
  }

  // 🔍 Récupérer une catégorie par ID
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: number) {
    try {
      const category = await this.categoryService.findOne(id);
      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }
      return category;
    } catch (error) {
      throw new NotFoundException(error.message || 'Category not found');
    }
  }

  // ✏️ Mettre à jour une catégorie
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: number, @Body() dto: UpdateCategoryDto) {
    try {
      const updatedCategory = await this.categoryService.update(id, dto);
      if (!updatedCategory) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }
      return updatedCategory;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new NotFoundException(error.message || 'Category not found');
    }
  }

  // 🗑️ Supprimer une catégorie
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: number) {
    try {
      await this.categoryService.remove(id);
      return { message: 'Category deleted successfully' };
    } catch (error) {
      throw new NotFoundException(error.message || 'Category not found');
    }
  }
}
