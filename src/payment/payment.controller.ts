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

      if (verifyPayment.status === true) {
        const payment = await this.prisma.payment.findUnique({
          where: {
            initReference: reference,
          },
        });

        const order = await this.prisma.order.findUnique({
          where: {
            id: payment?.orderId,
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
      }

      return res.status(200).send('success');
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
