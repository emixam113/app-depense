import { DataSource, DataSourceOptions } from 'typeorm';
import * as path from 'path';

export const databaseConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'athao03200',
  database: process.env.DATABASE_NAME || 'expense_db',
  entities: [path.resolve(__dirname, '/../**/*.entity.{ts,js}')],
  migrations: [__dirname + '/../migrations/*.ts'],  // ← simplifié
  synchronize: false,
  logging: ['migration', 'schema'],
};
