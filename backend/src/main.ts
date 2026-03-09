import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module'; // Assure-toi que c'est ton module racine (AppModule)
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Appliquer la validation globale avant de démarrer l'écoute
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const port = process.env.PORT || 3000;
  await app.listen(port,'0.0.0.0');

  Logger.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();