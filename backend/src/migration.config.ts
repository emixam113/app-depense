import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from './user/entity/user.entity';
import { Category } from './category/entity/category.entity';
import { Expense } from './expense/entity/expense.entity';

config(); // charge le fichier .env

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
  logging: true,
});
