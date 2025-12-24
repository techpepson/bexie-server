/*
https://docs.nestjs.com/providers#services
*/

import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { HelpersService } from '../helpers/helpers.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdminActionOnVendor,
  currency,
  OrderStatus,
  PaymentMethod,
  RiderStatus,
  Role,
  Status,
} from '../enum/app.enum';
import { ConfigService } from '@nestjs/config';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class AdminService {
  logger = new Logger(AdminService.name);
  constructor(
    private readonly helper: HelpersService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly payment: PaymentService,
  ) {}

  async verifyVendor(
    email: string,
    vendorId: string,
    vendorName: string,
    vendorMail: string,
  ) {
    try {
      const user = await this.helper.fetchUser(email);

      if (!user.exists) {
        throw new NotFoundException('User does not exist');
      }

      //check if user is an admin
      await this.helper.checkAdmin(email, Role.ADMIN || Role.SYSTEM_ADMIN);

      //fetch vendor
      const vendor = await this.prisma.vendor.findUnique({
        where: {
          id: vendorId,
        },
        include: {
          user: true,
        },
      });
      if (!vendor) {
        throw new NotFoundException('Vendor not found');
      }

      //verify the user
      await this.prisma.vendor.update({
        where: {
          id: vendorId,
        },
        data: {
          status: Status.APPROVED,
        },
      });

      //send a mail to the user informing them of verification
      await this.helper.sendMail(
        vendorMail,
        {
          userName: vendorName,
          userEmail: vendorMail,
          verificationDate: new Date().toDateString(),
          appUrl: this.config.get('APP_URL'),
          supportUrl: this.config.get('SUPPORT_URL'),
          facebookUrl: this.config.get('FACEBOOK_URL'),
          twitterUrl: this.config.get('TWITTER_URL'),
          instagramUrl: this.config.get('INSTAGRAM_URL'),
          currentYear: new Date().getFullYear(),
        },
        'account-verification-success',
        'Vendor Verification Successful',
      );

      //create transfer recipient
      const mobileMoney = await this.prisma.mobileMoney.findUnique({
        where: {
          userId: vendor.user.id,
        },
      });

      if (!mobileMoney) {
        throw new NotFoundException('Vendor mobile money details not found');
      }

      //create transfer recipient logic here
      const recipient = await this.payment.createTransferRecipient(
        mobileMoney.phoneNumber,
        mobileMoney.bankCode,
        vendor.user.name,
        PaymentMethod.MOBILE_MONEY,
      );

      //update transfer recipient status
      await this.prisma.transferRecipients.create({
        data: {
          type: PaymentMethod.MOBILE_MONEY,
          currency: currency.GHS,
          name: recipient.name,
          userId: vendor.user.id,
          accountNumber: recipient.accountNumber,
          bankCode: recipient.bankCode,
          bankName: recipient.bankName,
          recipientCode: recipient.recipientCode,
        },
      });

      return {
        message: 'Vendor verified successfully',
      };
    } catch (error) {
      this.logger.error(error.message);
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }

  async getAllVendors(email: string) {
    try {
      await this.helper.checkAdmin(email, Role.ADMIN || Role.SYSTEM_ADMIN);
      const vendors = await this.prisma.vendor.findMany({
        include: {
          user: true,
          shop: true,
          coupons: true,
        },
      });
      return vendors;
    } catch (error) {
      this.logger.error(error.message);
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }

  async getActiveUsers(email: string) {
    try {
      await this.helper.checkAdmin(email, Role.ADMIN || Role.SYSTEM_ADMIN);
      const users = await this.prisma.user.findMany({
        where: {
          status: Status.ACTIVE,
        },
      });
      return users;
    } catch (error) {
      this.logger.error(error.message);
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }

  async getAllUsers(email: string) {
    try {
      await this.helper.checkAdmin(email, Role.ADMIN || Role.SYSTEM_ADMIN);
      const users = await this.prisma.user.findMany();
      return users;
    } catch (error) {
      this.logger.error(error.message);
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }

  async getActiveRiders(email: string) {
    try {
      await this.helper.checkAdmin(email, Role.ADMIN || Role.SYSTEM_ADMIN);
      const riders = await this.prisma.rider.findMany({
        where: {
          status: RiderStatus.AVAILABLE,
        },
        include: {
          user: true,
        },
      });
      return riders;
    } catch (error) {
      this.logger.error(error.message);
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }

  async getAllOrders(email: string) {
    try {
      await this.helper.checkAdmin(email, Role.ADMIN || Role.SYSTEM_ADMIN);
      const orders = await this.prisma.order.findMany({
        where: {
          status: OrderStatus.DELIVERED,
        },
        include: {
          consumer: {
            include: {
              user: true,
            },
          },
          rider: {
            include: {
              user: true,
            },
          },
          items: true,
          reviews: true,
        },
      });
      return orders;
    } catch (error) {
      this.logger.error(error.message);
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }

  async performActionOnVendor(
    email: string,
    action: AdminActionOnVendor,
    vendorId: string,
  ) {
    try {
      await this.helper.checkAdmin(email, Role.ADMIN || Role.SYSTEM_ADMIN);
      if (action === AdminActionOnVendor.APPROVE) {
        const vendor = await this.prisma.vendor.update({
          where: { id: vendorId },
          data: { status: Status.APPROVED },
        });
        return {
          message: 'Vendor approved successfully',
          vendor,
        };
      } else if (action === AdminActionOnVendor.SUSPEND) {
        const vendor = await this.prisma.vendor.update({
          where: { id: vendorId },
          data: { status: Status.SUSPENDED },
        });
        return {
          message: 'Vendor suspended successfully',
          vendor,
        };
      } else if (action === AdminActionOnVendor.REMOVE) {
        const vendor = await this.prisma.vendor.delete({
          where: { id: vendorId },
        });
        return {
          message: 'Vendor removed successfully',
          vendor,
        };
      }
    } catch (error) {
      this.logger.error(error.message);
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }

  async performActionOnConsumer(
    email: string,
    action: AdminActionOnVendor,
    consumerId: string,
  ) {
    try {
      await this.helper.checkAdmin(email, Role.ADMIN || Role.SYSTEM_ADMIN);
      if (action === AdminActionOnVendor.APPROVE) {
        const vendor = await this.prisma.user.update({
          where: { id: consumerId },
          data: { status: Status.ACTIVE },
        });
        return {
          message: 'User approved successfully',
          vendor,
        };
      } else if (action === AdminActionOnVendor.SUSPEND) {
        const vendor = await this.prisma.user.update({
          where: { id: consumerId },
          data: { status: Status.SUSPENDED },
        });
        return {
          message: 'User suspended successfully',
          vendor,
        };
      } else if (action === AdminActionOnVendor.REMOVE) {
        const vendor = await this.prisma.user.delete({
          where: { id: consumerId },
        });
        return {
          message: 'User removed successfully',
          vendor,
        };
      }
    } catch (error) {
      this.logger.error(error.message);
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }
}
