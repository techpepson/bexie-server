/*
https://docs.nestjs.com/providers#services
*/

import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from '../dto/auth.dto';
import { HelpersService } from '../helpers/helpers.service';
import bcrypt from 'bcrypt';
import { Role, Status } from '../enum/app.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly helpers: HelpersService,
  ) {}

  async register(payload: RegisterDto) {
    const user = await this.helpers.fetchUser(payload.email);

    //check if user exists
    if (user.exists) {
      throw new ConflictException('User account already exists.');
    }

    //hash user password
    const hashedPassword = await bcrypt.hash(payload.password, 10);

    //store the user data the db

    const saveUser = await this.prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        password: hashedPassword,
        role: payload.role as Role,
        phone: payload.phone,
        status: Status.PENDING,
      },
    });

    return saveUser;
  }

  async login() {}
}
