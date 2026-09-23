import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

import { User } from '../user/entity/user.entity';
import { ResetToken } from '../auth/entity/reset-token.entity';
import { Expense } from '../expense/entity/expense.entity';
import { Method } from '../methode/entity/method.entity';
import { Category } from '../category/entity/category.entity';

export const databaseConfig = (
    configService: ConfigService,
): TypeOrmModuleOptions => {
  const dbUrl = configService.get<string>('DATABASE_URL');

  return {
    type: 'postgres',
    // Si l'URL existe, on l'utilise et on ignore le host/port/etc.
    url: dbUrl,
    // Configuration fallback pour le local
    host: dbUrl ? undefined : configService.get<string>('DATABASE_HOST', 'localhost'),
    port: dbUrl ? undefined : parseInt(configService.get<string>('DATABASE_PORT', '5432'), 10),
    username: dbUrl ? undefined : configService.get<string>('DATABASE_USERNAME', 'postgres'),
    password: dbUrl ? undefined : configService.get<string>('DATABASE_PASSWORD', 'athao03200'),
    database: dbUrl ? undefined : configService.get<string>('DATABASE_NAME', 'fineo_dev_empty'),

    entities: [User, ResetToken, Expense, Method, Category],
    migrations: [join(__dirname, '..', 'migrations', '*.{ts,js}')],
    synchronize: false,
    logging: ['migration', 'schema'],
    // SSL est obligatoire pour les bases Render
    ssl: dbUrl ? { rejectUnauthorized: false } : false,
  };
};