import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import {TypeOrmModule} from '@nestjs/typeorm'
import {User} from './entity/user.entity'
import { UserController } from './user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UserService], 
  controllers: [UserController], 
  exports: [TypeOrmModule, UserService],
        

})
export class UserModule {}
