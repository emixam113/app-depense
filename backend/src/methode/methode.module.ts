import { Module } from '@nestjs/common';
import { MethodeService } from './methode.service';
import { MethodeController } from './methode.controller';

@Module({
  providers: [MethodeService],
  controllers: [MethodeController]
})
export class MethodeModule {}
