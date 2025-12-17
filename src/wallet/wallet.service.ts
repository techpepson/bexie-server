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
import { currency, PaymentMethod, PaymentStatus } from '../enum/app.enum';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class WalletService {
  logger = new Logger(WalletService.name);
  constructor(
    private readonly helper: HelpersService,
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
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
          currency: currency.GHS,
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

  async transferToAnotherWallet(
    email: string,
    amount: number,
    recipientEmail: string,
  ) {
    try {
      const sender = await this.helper.fetchUser(email);
      if (!sender.exists) {
        throw new NotFoundException('Sender not found');
      }

      const recipient = await this.helper.fetchUser(recipientEmail);
      if (!recipient.exists) {
        throw new NotFoundException('Recipient not found');
      }

      const senderWallet = await this.prisma.wallet.findUnique({
        where: {
          userId: sender.data!.id,
        },
      });
      if (!senderWallet) {
        throw new NotFoundException('Sender wallet not found');
      }

      if (senderWallet.balance < amount) {
        throw new InternalServerErrorException('Insufficient wallet balance');
      }

      const recipientWallet = await this.prisma.wallet.findUnique({
        where: {
          userId: recipient.data!.id,
        },
      });
      if (!recipientWallet) {
        throw new NotFoundException('Recipient wallet not found');
      }

      const transferRecipient = await this.prisma.transferRecipients.findFirst({
        where: {
          userId: recipient.data!.id,
        },
      });

      if (!transferRecipient) {
        throw new NotFoundException('Transfer recipient not found');
      }

      const reference = this.helper.randomCodeGen();
      const params = {
        source: 'balance',
        amount: amount * 100,
        reason: `Transfer to ${recipientEmail}`,
        recipient: transferRecipient.recipientCode,
        reference: `${reference}`,
      };

      //initiate transfer
      const job = await this.paymentQueue.add('initiate-transfer', {
        amount: params.amount,
        recipient: params.recipient,
        reason: params.reason,
      });

      //credit amount to recipient wallet
      await this.prisma.wallet.update({
        where: {
          id: recipientWallet.id,
        },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      return {
        message: 'Transfer initiated successfully',
        jobId: job.id,
        transferCode: job.returnvalue.transferCode,
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

  async finalizeTransfer(
    jobId: string,
    transferCode: string,
    email: string,
    amount: number,
    recipientEmail: string,
  ) {
    try {
      const job = await this.paymentQueue.getJob(jobId);
      const jobState = await job?.getState();

      const sender = await this.helper.fetchUser(email);
      if (!sender.exists) {
        throw new NotFoundException('Sender not found');
      }

      const recipient = await this.helper.fetchUser(recipientEmail);
      if (!recipient.exists) {
        throw new NotFoundException('Recipient not found');
      }

      const senderWallet = await this.prisma.wallet.findUnique({
        where: {
          userId: sender.data!.id,
        },
      });

      if (!senderWallet) {
        throw new NotFoundException('Sender wallet not found');
      }

      if (senderWallet.balance < amount) {
        throw new InternalServerErrorException('Insufficient wallet balance');
      }

      const recipientWallet = await this.prisma.wallet.findUnique({
        where: {
          userId: recipient.data!.id,
        },
      });
      if (!recipientWallet) {
        throw new NotFoundException('Recipient wallet not found');
      }

      const transferRecipient = await this.prisma.transferRecipients.findFirst({
        where: {
          userId: recipient.data!.id,
        },
      });
      if (!transferRecipient) {
        throw new NotFoundException('Transfer recipient not found');
      }

      if (!job) {
        throw new NotFoundException('Job not found');
      }

      if (jobState !== 'completed') {
        throw new InternalServerErrorException(
          'Job not completed yet. Please try again later',
        );
      }

      //finalize transfer
      const result = await this.paymentService.finalizeTransfer(transferCode);
      if (result.status === 'success') {
        //update wallets of recipient and sender accordingly

        //credit amount to recipient wallet
        await this.prisma.wallet.update({
          where: {
            id: recipientWallet.id,
          },
          data: {
            balance: {
              increment: amount,
            },
          },
        });
        //debit amount from sender wallet
        await this.prisma.wallet.update({
          where: {
            id: senderWallet.id,
          },
          data: {
            balance: {
              decrement: amount,
            },
          },
        });

        return {
          message: 'Transfer finalized successfully',
          amount: result.amount,
          transferCode: result.transferCode,
          currency: result.currency,
          reason: result.reason,
          status: result.status,
        };
      }
    } catch (error) {
      this.logger.error(error.message);
    }
  }
}
