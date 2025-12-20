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

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(400).send('Invalid signature');
    }

    const payload: any = req.body;

    if (payload?.event !== 'charge.success') {
      return res.status(200).send('Ignored');
    }

    const reference = payload.data.reference;
    const verifyPayment = await this.paymentService.verifyPayment(reference);

    if (!verifyPayment.status || !reference) {
      return res.status(400).send('Payment not verified');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { initReference: reference },
    });

    if (!payment || !payment.orderId) {
      return res.status(404).send('Payment or order not found');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: payment.orderId },
      include: {
        items: true,
        consumer: true,
      },
    });

    if (!order) return res.status(404).send('Order not found');

    // 🛡 Prevent double processing
    if (order.paymentStatus === 'completed') {
      return res.status(200).send('Already processed');
    }

    await this.prisma.$transaction(async (tx) => {
      // ✅ Update payment
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.COMPLETED },
      });

      // ✅ Update order
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PROCESSING,
          paymentStatus: PaymentStatus.COMPLETED,
        },
      });

      // =========================
      // 🎁 Referral commission
      // =========================
      if (order.referralCode) {
        const consumer = await tx.consumer.findUnique({
          where: { referralCode: order.referralCode },
        });

        if (consumer) {
          const commission = (order.totalPrice * 2) / 100;

          const earning = await tx.earning.findUnique({
            where: { consumerId: consumer.id },
          });

          if (earning) {
            await tx.earning.update({
              where: { id: earning.id },
              data: {
                totalAmount: { increment: commission },
                pendingCommission: { increment: commission },
              },
            });
          } else {
            await tx.earning.create({
              data: {
                consumerId: consumer.id,
                totalAmount: commission,
                pendingCommission: commission,
              },
            });
          }

          await tx.wallet.upsert({
            where: { userId: consumer.userId },
            update: { balance: { increment: commission } },
            create: { userId: consumer.userId, balance: commission },
          });
        }
      }

      // =========================
      // 🛒 Vendor payouts
      // =========================
      const orderItems = order.items;

      const orderProducts = await tx.product.findMany({
        where: {
          id: { in: orderItems.map((i) => i.productId) },
        },
        include: { shop: true },
      });

      // 🗺 Map productId → vendorId
      const productVendorMap = new Map<string, string>(
        orderProducts.map((p) => [p.id, p.shop.vendorId]),
      );

      // 💰 Accumulate totals per vendor
      const vendorTotals: Record<string, number> = {};

      for (const item of orderItems) {
        const vendorId = productVendorMap.get(item.productId);
        if (!vendorId) continue;

        const amount = item.price * item.quantity;

        vendorTotals[vendorId] = (vendorTotals[vendorId] || 0) + amount;
      }

      // 🏦 Update each vendor wallet
      for (const [vendorId, amount] of Object.entries(vendorTotals)) {
        await tx.wallet.upsert({
          where: { userId: vendorId },
          update: { balance: { increment: amount } },
          create: { userId: vendorId, balance: amount },
        });
      }
    });

    return res.status(200).send('success');
  }
}
