/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { PrismaService } from '../prisma/prisma.service';
import { HelpersService } from '../helpers/helpers.service';

@Module({
  imports: [],
  controllers: [CartController],
  providers: [PrismaService, HelpersService],
})
export class CartModule {}
