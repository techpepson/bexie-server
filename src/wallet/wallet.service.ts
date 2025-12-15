import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { HelpersService } from '../helpers/helpers.service';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PaymentMethod, PaymentStatus } from '../enum/app.enum';

@Injectable()
export class WalletService {
  logger = new Logger(WalletService.name);
  constructor(
    private readonly helper: HelpersService,
    private readonly prisma: PrismaService,
    @InjectQueue('payment') private readonly paymentQueue: Queue,
  ) {}

  async createwallet(email: string) {
    try {
      const user = await this.helper.fetchUser(email);
      if (!user.exists) {
        throw new NotFoundException('User not found');
      }

      //create the user wallet
      await this.prisma.user.update({
        where: {
          email,
        },
        data: {
          wallet: {
            create: {
              balance: 0.0,
            },
          },
        },
        include: {
          wallet: true,
        },
      });
    } catch (error) {
      this.logger.error(error.message);
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        throw new InternalServerErrorException('Internal server error');
      }
    }
  }

  async topUpWallet(
    email: string,
    amount: number,
    paymentMethod: PaymentMethod,
  ) {
    try {
      const user = await this.helper.fetchUser(email);
      if (!user.exists) {
        throw new NotFoundException('User not found');
      }

      if (amount <= 0) {
        throw new InternalServerErrorException(
          'Top up amount must be greater than zero',
        );
      }

      //initialize payment here
      const job = await this.paymentQueue.add('intialize-payment', {
        email: email,
        amount,
        paymentMethod,
        displayName: 'WALLET_TOPUP',
      });

      //create payment data for wallet top up
      await this.prisma.payment.create({
        data: {
          amount: amount,
          userId: user.data!.id,
          currency: 'GHS',
          paymentMethod: paymentMethod,
          initReference: job.returnvalue.reference,
          status: PaymentStatus.PENDING,
        },
      });

      //top up the wallet
      return {
        message: 'Wallet topped initiating started',
        jobId: job.id,
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

  async getWalletBalance(email: string) {
    try {
      const user = await this.helper.fetchUser(email);
      if (!user.exists) {
        throw new NotFoundException('User not found');
      }

      const wallet = await this.prisma.wallet.findUnique({
        where: {
          userId: user.data!.id,
        },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      return {
        message: 'Wallet balance fetched successfully',
        balance: wallet.balance,
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
