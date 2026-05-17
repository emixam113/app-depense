import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // Import nécessaire
import { MethodeService } from './methode.service';
import { MethodeController } from './methode.controller';
import { Method } from './entity/method.entity'; // Vérifie bien le chemin vers ton entité

@Module({
  imports: [
    // Ajoute cette ligne pour injecter le Repository dans le service
    TypeOrmModule.forFeature([Method]),
  ],
  providers: [MethodeService],
  controllers: [MethodeController],
  exports: [MethodeService], // Utile si tu veux l'utiliser dans un autre module plus tard
})
export class MethodeModule {}
