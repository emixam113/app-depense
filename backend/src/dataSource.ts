import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { join } from 'path';
dotenv.config();

console.log('DEBUG - DATABASE_URL est :', process.env.DATABASE_URL);
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'athao03200',
  database: process.env.DB_NAME || 'expense_db',
  entities: [join(__dirname, '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false,
  logging: true,

});
