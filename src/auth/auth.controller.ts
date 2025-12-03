/*
Comprehensive AuthController
Provides REST endpoints for registration, email verification, login,
password reset token requests, and token verification. Validation is applied
via class-validator and Nest's ValidationPipe.
*/

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from '../dto/auth.dto';
import { PasswordResetChannel } from '../enum/app.enum';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Request } from 'express';

class CheckPasswordDto {
  @IsNotEmpty()
  @IsString()
  oldPassword: string;
}

class VerifyPasswordDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  newPassword: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() payload: RegisterDto) {
    return await this.authService.register(payload);
  }

  @Get('verify-email')
  @UseGuards(JwtAuthGuard)
  async verifyEmail(@Query('token') token: string, @Req() req: Request) {
    const email = await (req.user as any)?.email;
    return await this.authService.verifyEmail(token, email);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() payload: LoginDto) {
    return await this.authService.login(payload);
  }

  @Post('check-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async checkPassword(@Body() body: CheckPasswordDto, @Req() req: Request) {
    const email = await (req.user as any)?.email;
    await this.authService.checkPasswordEquality(body.oldPassword, email);
    return { message: 'Password matches.' };
  }

  @Post('request-token')
  @HttpCode(HttpStatus.OK)
  async requestToken(
    @Query('channel') channel: PasswordResetChannel,
    @Req() req: Request,
  ) {
    const email = await (req.user as any)?.email;
    return await this.authService.requestToken(channel, email);
  }

  @Post('verify-password')
  @HttpCode(HttpStatus.OK)
  async verifyPassword(
    @Body() body: VerifyPasswordDto,
    @Req() req: Request,
    @Query('token') token: string,
  ) {
    const email = await (req.user as any)?.email;
    await this.authService.verifyPasswordToken(token, email, body.newPassword);
    return { message: 'Password reset successfully.' };
  }
}
