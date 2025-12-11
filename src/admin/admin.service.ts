/*
https://docs.nestjs.com/providers#services
*/

import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminService {
  constructor() {}

  async verifyVendor() {
    //create transfer recipient when account is verified
  }
}
