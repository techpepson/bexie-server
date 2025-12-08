import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { Module } from '@nestjs/common';
import { HelpersService } from '../helpers/helpers.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

@Module({
  imports: [
    JwtModule.register({
      secret: '',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [HelpersService, PrismaService, AuthService, JwtService],
})
export class AuthModule {}
