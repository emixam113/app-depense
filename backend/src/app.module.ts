// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { MethodeModule } from './methode/methode.module';
import { ExpenseModule } from './expense/expense.module';
import { CategoryModule } from './category/category.module';
import { AuthModule } from './auth/auth.module';
import { databaseConfig } from './config/database.config';
import { MailModule } from './mail/mail.module';
import { NotificationModule } from './Notifications/Notification.module';
import { ExportModule } from './export/export.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, '..', '.env'),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        databaseConfig(configService),
    }),
    ScheduleModule.forRoot(),
    UserModule,
    MethodeModule,
    ExpenseModule,
    CategoryModule,
    AuthModule,
    MailModule,
    NotificationModule,
    ExportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
