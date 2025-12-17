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
import { currency, PaymentMethod, Role, Status } from '../enum/app.enum';
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
      await this.helper.checkRole(email, Role.ADMIN || Role.SYSTEM_ADMIN);

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
        mobileMoney!.phoneNumber,
        mobileMoney!.bankCode,
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
        throw new InternalServerErrorException('Internal server error');
      }
    }
  }
}
