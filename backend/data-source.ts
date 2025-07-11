import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { join } from 'path';

config();

const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  host: configService.get<string>('DATABASE_HOST', 'localhost'),
  port: parseInt(configService.get<string>('DATABASE_PORT', '5432'), 10),
  username: configService.get<string>('DATABASE_USERNAME', 'postgres'),
  password: configService.get<string>('DATABASE_PASSWORD', 'athao03200'),
  database: configService.get<string>('DATABASE_NAME', 'expense_db'),
  entities: [join(__dirname, 'src', '**', '*.entity{.ts,.js}')],
  migrations: [join(__dirname, 'src', 'migrations', '*.{ts,js}')],
  synchronize: false,
  logging: true,
});
