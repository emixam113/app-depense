import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { join } from 'path';

dotenv.config();

// DEBUG - Si tu vois "undefined" dans les logs Render, alors DATABASE_URL n'est pas configurée sur Render
console.log('DEBUG - DATABASE_URL est :', process.env.DATABASE_URL);

export const AppDataSource = new DataSource({
  type: 'postgres',
  // On utilise l'URL fournie par Render, ou les valeurs locales par défaut
  url: process.env.DATABASE_URL || undefined,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'athao03200',
  database: process.env.DB_NAME || 'fineo_dev_empty',

  entities: [join(__dirname, '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false,
  logging: true,
  // Indispensable pour la connexion sécurisée sur Render
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});