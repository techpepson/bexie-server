/*
https://docs.nestjs.com/providers#services
*/

import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentService {
  constructor() {}

  async initializePayment() {}

  async verifyPayment() {}

  async transferFunds() {}
}
