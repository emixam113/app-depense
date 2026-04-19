import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule], // On importe UserModule pour avoir accès au UserService
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
