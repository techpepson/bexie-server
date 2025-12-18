import { HelpersService } from '../helpers/helpers.service';
import { PrismaService } from '../prisma/prisma.service';
import { WishlistController } from './wishlist.controller';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [WishlistController],
  providers: [PrismaService, HelpersService],
})
export class WishlistModule {}
