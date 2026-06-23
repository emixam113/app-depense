// src/notification/notification.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushService } from './push.service';
import { NotificationController } from './notification.controller';
import { NotificationService } from './Notification.service';
import { User } from '../user/entity/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [NotificationController],
  providers: [PushService, NotificationService],
  exports: [PushService, NotificationService],
})
export class NotificationModule {}
