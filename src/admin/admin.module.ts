import { ConfigService } from '@nestjs/config';
import { HelpersService } from '../helpers/helpers.service';
import { PaymentService } from '../payment/payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [AdminController],
  providers: [
    ConfigService,
    AdminService,
    PrismaService,
    HelpersService,
    PaymentService,
  ],
})
export class AdminModule {}
