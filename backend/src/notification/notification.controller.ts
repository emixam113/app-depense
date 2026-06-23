// src/notification/notification.controller.ts
import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';
import { JwtAuthGuard } from '../auth/JWT/jwt-auth.guard';
import { NotificationService } from './notification.service';


export class RegisterTokenDto {
  @IsString()
  @IsNotEmpty()
  pushToken: string;
}


@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}


  @UseGuards(JwtAuthGuard)
  @Post('register-token')
  @HttpCode(HttpStatus.OK)
  async registerToken(@Req() req: any, @Body() dto: RegisterTokenDto) {
    await this.notificationService.savePushToken(req.user.id, dto.pushToken);
    return { success: true, message: 'Token push enregistré avec succès' };
  }
}
