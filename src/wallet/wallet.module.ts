import { BullModule } from '@nestjs/bullmq';
import { HelpersService } from '../helpers/helpers.service';
import { PrismaService } from '../prisma/prisma.service';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

import { Module } from '@nestjs/common';
import { PaymentService } from '../payment/payment.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [BullModule.registerQueue({ name: 'payment' }), HttpModule],
  controllers: [WalletController],
  providers: [WalletService, HelpersService, PrismaService, PaymentService],
})
export class WalletModule {}
