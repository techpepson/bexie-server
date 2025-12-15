import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HelpersService } from '../helpers/helpers.service';

@Injectable()
export class EarningService {
  logger = new Logger(EarningService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly helper: HelpersService,
  ) {}

  async generateReferralCode(email: string): Promise<any> {
    try {
      const user = await this.helper.fetchUser(email);

      //check if user exists
      if (!user.data) {
        throw new NotFoundException('User not found');
      }

      //generate referral code logic here
      const token = this.helper.randomCodeGen();
      const referralCode = `REF-${token}`;

      //save the referral code to db
      const savedCode = await this.prisma.consumer.update({
        where: {
          userId: user.data.id,
        },
        data: {
          referralCode,
        },
      });

      return {
        message: 'Referral code generated successfully',
        referralCode: savedCode.referralCode,
      };
    } catch (error) {
      this.logger.error(error.message);
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        throw new Error('Internal server error');
      }
    }
  }
}
