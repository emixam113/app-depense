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
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DATABASE_HOST', 'localhost'),
  port: parseInt(configService.get<string>('DATABASE_PORT', '5432'), 10),
  username: configService.get<string>('DATABASE_USERNAME', 'postgres'),
  password: configService.get<string>('DATABASE_PASSWORD', 'athao03200'),
  database: configService.get<string>('DATABASE_NAME', 'expense_db'),
  entities: [
    User,
    ResetToken,
    Expense,
    Method,
    Category,
  ],
  migrations: [join(__dirname, '..', 'migrations', '*.{ts,js}')],
  synchronize: false,
  logging: ['migration', 'schema'],
});