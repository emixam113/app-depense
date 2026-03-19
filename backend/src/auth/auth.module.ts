import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '../user/entity/user.entity';
import { UserModule } from '../user/user.module';
import { ResetToken } from './entity/reset-token.entity';
import { ResetTokenService } from './reset-token.service';
import { MailModule } from '../mail/mail.module';
import { JwtStrategy } from './JWT/jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => MailModule), // ✅ utile si MailModule dépend aussi de AuthModule
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([User, ResetToken]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'secretKey',
        signOptions: {
          expiresIn:
            (configService.get('JWT_EXPIRES_IN') as JwtSignOptions['expiresIn']) || '1d',
        },
      }),
    }),
    forwardRef(() => UserModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, ResetTokenService, JwtStrategy],
  exports: [
    AuthService,
    ResetTokenService, // ✅ ajouté ici pour que MailModule puisse y accéder
    PassportModule,
    JwtStrategy,
  ],
})
export class AuthModule {}
