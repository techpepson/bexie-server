import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
