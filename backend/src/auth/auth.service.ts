import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { User } from '../user/entity/user.entity';
import { SignupDTO } from './DTO/Signup.dto';
import { LoginDto } from './DTO/login.dto';


@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService
  ) { }



  //method signup:
  async signup(signupDTO: SignupDTO): Promise<{ access_token: string }> {
    const { email, password, confirmPassword, firstName, lastName, birthDate } = signupDTO;

    //verify password: 
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords are not the same');
    }
    
    // verify existing user: 
    const existingUser = await this.userRepository.findOne({where: {email}});
    if(existingUser){
      throw new BadRequestException('User already exist');
    }
    
    //hashedPassword: 
    const hashedPassword = await argon2.hash(password); 

    //create and save user:
    const user = this.userRepository.create({
      email, 
      password: hashedPassword, 
      firstName,
      lastName, 
      birthDate,
    });
    
    await this.userRepository.save(user);

    //generate du JWT: 
    const access_token = await this.generateJwt(user);
    return {access_token}
  }

  //login method: 
  async login(loginDto: LoginDto): Promise<{access_token: string}>{
      const {email, password} = loginDto;
      const user = await this.userRepository.findOne({where: {email}});

    if(!user){
      throw new BadRequestException('User already exist')
    }
    
    const isPasswordValid = await argon2.verify(user.password, password);
    
    if(!isPasswordValid){
      throw new BadRequestException('Invalid credential');
    }
    const access_token = await this.generateJwt(user); 
    return {access_token}
  }

  //private method for generate JWT: 
  private async generateJwt(user: User):  Promise<string>{
    const payload = {
      sub: user.id, 
      email: user.email
    };
    return this.jwtService.signAsync(payload)
  }

  





}
