import {Controller, Get, Post, Body, Param, Delete, ParseIntPipe, Patch} from '@nestjs/common';
import {UserService} from './user.service';
import {User} from './entity/user.entity';
import {CreateUserDto} from '../user/dto/create-user.dto';
import {UpdateUserDto} from '../user/dto/update-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  //create new user

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<User>{
    return this.userService.create(createUserDto);
  }

  //get all users
  @Get()
  async findAll(): Promise<User[]>{
    return this.userService.findAll()
  }

  //get user by id 
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<User>{
    return this.userService.findOne(id);
  }

  //update user by id
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() UpdateUserDto: UpdateUserDto
  ): Promise<User>{
    return this.userService.update(id, UpdateUserDto);
  }

  //delete user by id
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void>{
    return this.userService.remove(id)
  }

}