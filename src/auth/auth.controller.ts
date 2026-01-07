import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from '../dto/auth.dto';
import { Request } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PasswordResetChannel } from '../enum/app.enum';
import { AdminDto } from '../dto/admin.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() payload: RegisterDto) {
    const register = await this.authService.register(payload);
    return register;
  }

  @UseGuards(JwtAuthGuard)
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string, @Req() req: Request) {
    const email = (req.user as any)?.email;
    const verify = await this.authService.verifyEmail(email, token);
    return verify;
  }

  async login(@Body() payload: LoginDto) {
    const login = await this.authService.login(payload);
    return login;
  }

  @UseGuards(JwtAuthGuard)
  @Post('check-password-equality')
  async checkPasswordEquality(
    @Body() oldPassword: string,
    @Req() req: Request,
  ) {
    const email = (req.user as any)?.email;
    const passwordVisibility = await this.authService.checkPasswordEquality(
      oldPassword,
      email,
    );
    return passwordVisibility;
  }

  @UseGuards(JwtAuthGuard)
  @Get('request-token')
  async requestToken(
    @Query('channel') channel: PasswordResetChannel,
    @Req() req: Request,
  ) {
    const email = (req.user as any)?.email;
    const requestToken = await this.authService.requestToken(channel, email);
    return requestToken;
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-password-token')
  async verifyPasswordTOken(
    @Body() newPassword: string,
    @Req() req: Request,
    @Query('token') token: string,
  ) {
    const email = (req.user as any).email;
    const verifyToken = await this.authService.verifyPasswordToken(
      token,
      email,
      newPassword,
    );
    return verifyToken;
  }

  @Post('login-admin')
  async loginAdmin(@Body() payload: Partial<AdminDto>) {
    const loginAdmin = await this.authService.loginAdmin(payload);
    return loginAdmin;
  }

  @UseGuards(JwtAuthGuard)
  @Post('create-admin')
  async createAdmin(@Body() payload: AdminDto, @Req() req: Request) {
    const email = (req.user as any).email;
    const createAdmin = await this.authService.createAdmin(email, payload);
    return createAdmin;
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @Post('update-admin')
  async updateAdmin(
    @Body() payload: Partial<AdminDto>,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const email = (req.user as any).email;
    const updateAdmin = await this.authService.updateAdmin(
      email,
      payload,
      file,
    );
    return updateAdmin;
  }

  async updateAdminPassword(
    @Body() newPassword: string,
    @Body() oldPassword: string,
    @Req() req: Request,
  ) {
    const email = (req.user as any).email;
    const updatePassword = await this.authService.updateAdminPassword(
      email,
      oldPassword,
      newPassword,
    );
    return updatePassword;
  }
}
