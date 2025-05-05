import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {User} from '../user/entity/user.entity';
import {SignUpDto} from './DTO/SignUp.dto';
import {LoginDto} from './DTO/Login.dto';
import * as argon2 from 'argon2'; 


@Injectable()
export class AuthService{
 constructor(
  @InjectRepository(User)
  private userRepository: Repository<User>, 
  private JwtService: JwtService 
 ){}
 
 
}