import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { MulterExceptionFilter } from './export/multer-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalFilters(new MulterExceptionFilter()); // ← ajouté

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  Logger.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
