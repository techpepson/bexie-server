import { BullModule } from '@nestjs/bullmq';
import { HelpersService } from '../helpers/helpers.service';
import { PrismaService } from '../prisma/prisma.service';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

import { Module } from '@nestjs/common';

@Module({
  imports: [BullModule.registerQueue({ name: 'payment' })],
  controllers: [WalletController],
  providers: [WalletService, HelpersService, PrismaService],
})
export class WalletModule {}
