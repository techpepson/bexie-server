/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HelpersService } from '../helpers/helpers.service';

@Module({
  imports: [],
  controllers: [],
  providers: [PrismaService, HelpersService],
})
export class UserModule {}
