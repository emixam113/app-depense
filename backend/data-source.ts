import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config();

export default new DataSource({
  type: 'postgres',
  // Si DATABASE_URL existe (cas de Render), on l'utilise directement
  url: process.env.DATABASE_URL,

  // Si DATABASE_URL n'existe pas (cas local), on utilise les autres variables
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'athao03200',
  database: process.env.DATABASE_NAME || 'expense_db',

  entities: [join(__dirname, '**', '*.entity{.ts,.js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false,
  logging: true,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false, // Nécessaire pour Render
});
