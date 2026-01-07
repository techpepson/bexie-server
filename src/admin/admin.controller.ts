import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { AdminActionOnVendor } from '../enum/app.enum';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @UseGuards(JwtAuthGuard)
  @Get('verify-vendor')
  async verifyVendor(@Query('vendorId') vendorId: string, @Req() req: Request) {
    const email = (req.user as any)?.email;
    const verify = await this.adminService.verifyVendor(email, vendorId);
    return verify;
  }

  @UseGuards(JwtAuthGuard)
  @Get('vendors')
  async getAllVendors(@Req() req: Request) {
    const email = (req.user as any)?.email;
    const vendors = await this.adminService.getAllVendors(email);
    return vendors;
  }

  @UseGuards(JwtAuthGuard)
  @Get('users/active')
  async getActiveUsers(@Req() req: Request) {
    const email = (req.user as any)?.email;
    const users = await this.adminService.getActiveUsers(email);
    return users;
  }

  @UseGuards(JwtAuthGuard)
  @Get('users')
  async getAllUsers(@Req() req: Request) {
    const email = (req.user as any)?.email;
    const users = await this.adminService.getAllUsers(email);
    return users;
  }

  @UseGuards(JwtAuthGuard)
  @Get('riders/active')
  async getActiveRiders(@Req() req: Request) {
    const email = (req.user as any)?.email;
    const riders = await this.adminService.getActiveRiders(email);
    return riders;
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders')
  async getAllOrders(@Req() req: Request) {
    const email = (req.user as any)?.email;
    const orders = await this.adminService.getAllOrders(email);
    return orders;
  }

  @UseGuards(JwtAuthGuard)
  @Post('vendor/action')
  async performActionOnVendor(
    @Body('action') action: AdminActionOnVendor,
    @Body('vendorId') vendorId: string,
    @Req() req: Request,
  ) {
    const email = (req.user as any)?.email;
    const result = await this.adminService.performActionOnVendor(
      email,
      action,
      vendorId,
    );
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('consumer/action')
  async performActionOnConsumer(
    @Body('action') action: AdminActionOnVendor,
    @Body('consumerId') consumerId: string,
    @Req() req: Request,
  ) {
    const email = (req.user as any)?.email;
    const result = await this.adminService.performActionOnConsumer(
      email,
      action,
      consumerId,
    );
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('rider/action')
  async performActionOnRider(
    @Body('action') action: AdminActionOnVendor,
    @Body('riderId') riderId: string,
    @Req() req: Request,
  ) {
    const email = (req.user as any)?.email;
    const result = await this.adminService.performActionOnRider(
      email,
      action,
      riderId,
    );
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('system-logs')
  async getSystemLogs(@Req() req: Request) {
    const email = (req.user as any)?.email;
    const logs = await this.adminService.getSystemLogs(email);
    return logs;
  }
}
