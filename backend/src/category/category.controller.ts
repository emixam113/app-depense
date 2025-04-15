import {Controller,Get,Post,Body,Param,Patch,Delete,ParseIntPipe  } from '@nestjs/common';
  import {CategoryService} from '../category/category.service';
  import {CreateCategoryDto} from './DTO/create-category.dto';
  import {UpdateCategoryDto} from './DTO/update-category.dto';
  import {Category} from '../category/entity/category.entity';


@Controller('categories')
export class CategoryController{

  constructor(private readonly categoryService: CategoryService){}

  //create new category
  @Post()
  create(@Body() dto: CreateCategoryDto): Promise<Category>{
   return this.categoryService.create(CreateCategoryDto);
}

//get all categories
@Get()
async findAll(): Promise<Category[]>{
  return this.categoryService.findAll();
}


//get one category by id
@Get(':id')
async findOne(@Param('id', ParseIntPipe) id: number): Promise<Category>{
  return this.categoryService.findOne(id);
}

//update category by id
@Patch(':id')
async update(
  @Param('id', ParseIntPipe) id: number,
  @Body() updateCategoryDto: UpdateCategoryDto,
): Promise<Category> {
  return this.categoryService.update(id, updateCategoryDto);
}


//delete category by id
@Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void>{
  return this.categoryService.remove(id);
  }
}