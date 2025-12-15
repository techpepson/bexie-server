import { HttpModule } from '@nestjs/axios';
import { PaymentService } from '../payment/payment.service';
import { AppProcessor } from './processor.service';

import { Module } from '@nestjs/common';

@Module({
  imports: [HttpModule],
  controllers: [],
  providers: [AppProcessor, PaymentService],
})
export class ProcessorModule {}
