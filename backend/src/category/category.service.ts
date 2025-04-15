import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository} from '@nestjs/typeorm'
import { Repository} from 'typeorm'
import {Category} from '../category/entity/category.entity'
import {CreateCategoryDto} from './DTO/create-category.dto'
import {UpdateCategoryDto} from './DTO/update-category.dto'


@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>
  ){}

  async create(dto: CreateCategoryDto): Promise<Category>{
    const category = this.categoryRepository.create(dto);
    return this.categoryRepository.save(category);
  }

  async findAll(): Promise<Category[]>{
    return this.categoryRepository.find();
  } 
  
  async findOne(id: number): Promise<Category>{
    const category = await this.categoryRepository.findOne({where: {id}});
    if(!category){
      throw new NotFoundException(`Category with id ${id } not found `)
    }
    return category; 
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category>{
    const category = await this.categoryRepository.preload({
      id,
      ...dto
    }); 
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    return this.categoryRepository.save(category);
  }

  async remove(id: number): Promise<void>{
    const category = await this.categoryRepository.findOneBy({id})
    if(!category){
      throw new NotFoundException(`Category with id ${id} not found`)
    }
    await this.categoryRepository.remove(category);
  }

}
