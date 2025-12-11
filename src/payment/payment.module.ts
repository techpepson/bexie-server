import { PaymentController } from './payment.controller';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PrismaService],
})
export class PaymentModule {}
