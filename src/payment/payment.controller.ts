import { Controller, Post, Req, Res } from '@nestjs/common';

import { PaymentService } from './payment.service';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import * as crypto from 'crypto';

import { MailerService } from '@nestjs-modules/mailer';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, PaymentStatus } from '../enum/app.enum';

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private configService: ConfigService,
    private httpService: HttpService,
    private readonly prisma: PrismaService,

    private readonly mailer: MailerService,
  ) {}

  @Post('webhooks/paystack')
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    const secret = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    if (!secret) throw new Error('Paystack secret key not found');

    const hash = crypto
      .createHmac('sha512', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    const payload: any = req.body;

    // Verify Paystack signature
    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(400).send('Invalid signature');
    }

    // Process only charge.success events
    if (payload?.event === 'charge.success') {
      const reference = payload.data.reference;
      const verifyPayment = await this.paymentService.verifyPayment(reference);

      if (
        verifyPayment.status === true &&
        payload.metadata?.custom_fields?.[0]?.display_name ===
          'ORDER_PAYMENT' &&
        reference
      ) {
        const payment = await this.prisma.payment.findUnique({
          where: {
            initReference: reference,
          },
        });

        const order = await this.prisma.order.findUnique({
          where: {
            id: payment!.orderId || undefined,
          },
        });

        if (!order) {
          return res.status(404).send('Order not found');
        }

        //update payment status
        await this.prisma.payment.update({
          where: {
            id: payment!.id,
          },
          data: {
            status: PaymentStatus.COMPLETED,
          },
        });

        //update order payment status
        await this.prisma.order.update({
          where: {
            id: order.id,
          },
          data: {
            status: OrderStatus.PROCESSING,
            paymentStatus: PaymentStatus.COMPLETED,
          },
        });

        //find and update referral code if exists
        const consumer = await this.prisma.consumer.findUnique({
          where: {
            referralCode: order.referralCode || '',
          },
        });

        //update the consumer's earnings if referral code exists
        if (consumer) {
          const earning = await this.prisma.earning.findUnique({
            where: {
              consumerId: consumer.id,
            },
          });

          const commission = (order.totalPrice * 2) / 100; //2% commission

          if (earning) {
            await this.prisma.earning.update({
              where: {
                id: earning.id,
              },
              data: {
                totalAmount: {
                  increment: commission,
                },
                pendingCommission: {
                  increment: commission,
                },
              },
            });
          } else {
            await this.prisma.earning.create({
              data: {
                totalAmount: commission,
                pendingCommission: commission,
                consumerId: consumer.id,
              },
            });
          }
        } else {
          console.log('Send failure of verification mail and remove order');
        }

        //webhook for wallet top-up
        if (
          payload.data.metadata?.custom_fields?.[0]?.display_name ===
            'WALLET_TOPUP' &&
          verifyPayment.status == true &&
          reference
        ) {
          const payment = await this.prisma.payment.findUnique({
            where: {
              initReference: reference,
            },
          });

          if (!payment) {
            return res.status(404).send('Payment not found');
          }

          //find the owner of teh payment
          const userWallet = await this.prisma.wallet.findUnique({
            where: {
              userId: payment.userId,
            },
          });

          if (!userWallet) {
            return res.status(404).send('User wallet not found');
          }

          //update wallet balance
          await this.prisma.wallet.update({
            where: {
              id: userWallet.id,
            },
            data: {
              balance: {
                increment: payment.amount,
              },
            },
          });

          //update payment status
          await this.prisma.payment.update({
            where: {
              id: payment.id,
            },
            data: {
              status: PaymentStatus.COMPLETED,
            },
          });
        }

        return res.status(200).send('success');
      }
    }

    if (payload?.event === 'paymentrequest.success') {
      //send an email to the user for their application

      return res.status(200).send('success');
    }

    if (payload?.event === 'transfer.success') {
      //send an email to the user for their application

      return res.status(200).send('success');
    }

    if (payload?.event === 'transfer.failed') {
      //send an email to the user for their application

      return res.status(400).send('success');
    }

    if (payload?.event === 'transfer.reversed') {
      //send an email to the user for their application

      return res.status(200).send('success');
    }
  }
}
