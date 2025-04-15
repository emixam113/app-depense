import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module'; // Assure-toi que c'est ton module racine (AppModule)
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuration de port et écoute
  const port = process.env.PORT || 3000;
  await app.listen(port);

  Logger.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();