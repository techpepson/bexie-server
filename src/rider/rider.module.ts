import { RiderController } from './rider.controller';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [RiderController],
  providers: [],
})
export class RiderModule {}
