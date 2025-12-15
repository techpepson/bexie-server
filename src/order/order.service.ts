import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  PreconditionFailedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HelpersService } from '../helpers/helpers.service';
import { OrderStatus, PaymentStatus, Role } from '../enum/app.enum';
import { OrderDto } from '../dto/order.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly helper: HelpersService,
    @InjectQueue('payment') private readonly paymentQueue: Queue,
  ) {}

  async placeOrder(email: string, payload: OrderDto, referralCode?: string) {
    try {
      const user = await this.helper.fetchUser(email);

      if (!user.exists) {
        throw new NotFoundException('User not found');
      }

      await this.helper.checkRole(email, Role.CONSUMER);

      const result = await this.prisma.$transaction(async (tx) => {
        // 1. Create order
        const order = await tx.order.create({
          data: {
            paymentMethod: payload.paymentMethod,
            paymentStatus: PaymentStatus.PENDING,
            address: payload.address,
            contact: payload.contact,
            totalPrice: payload.totalAmount,
            status: OrderStatus.PENDING,
            referralCode: referralCode || null,
            consumer: {
              connect: { userId: user.data!.id },
            },
            items: {
              createMany: {
                data: payload.items.map((item) => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  price: item.price,
                })),
              },
            },
            deliveryOption: {
              create: {
                type: payload.deliveryType,
                fee: payload.deliveryFee,
                unit: payload.unitOfDelivery,
                duration: payload.deliveryDuration,
              },
            },
          },
        });

        // 3. Queue payment initialization (NON-BLOCKING)
        const job = await this.paymentQueue.add('initialize-payment', {
          email,
          amount: payload.totalAmount,
          paymentChannel: payload.paymentMethod,
          displayName: `ORDER_PAYMENT`,
        });

        // 2. Create pending payment
        const payment = await tx.payment.create({
          data: {
            orderId: order.id,
            initReference: job.returnvalue.reference,
            userId: user.data!.id,
            amount: payload.totalAmount,
            currency: 'GHS',
            paymentMethod: payload.paymentMethod,
            status: PaymentStatus.PENDING,
          },
        });

        return { order, payment, job };
      });

      return {
        message: 'Order placed successfully',
        orderId: result.order.id,
        paymentStatus: PaymentStatus.PENDING,
        jobId: result.job.id,
      };
    } catch (error) {
      this.logger.error(error);
      if (
        error instanceof NotFoundException ||
        error instanceof PreconditionFailedException
      ) {
        throw error;
      } else {
        throw new InternalServerErrorException(
          error?.message || 'An error occurred while placing the order.',
        );
      }
    }
  }

  async checkJobStatus(jobId: string) {
    try {
      //check if job exists
      const job = await this.paymentQueue.getJob(jobId);
      if (!job) {
        throw new NotFoundException('Job not found');
      }

      //get job state
      const state = await job.getState();

      return {
        jobId: job.id,
        state,
        returnValue: job.returnvalue,
      };
    } catch (error) {
      this.logger.error(error);
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        throw new InternalServerErrorException(
          'An error occurred while checking job status',
        );
      }
    }
  }

  async getConsumerOrders(email: string) {
    try {
      const user = await this.helper.fetchUser(email);

      if (!user.exists) {
        throw new NotFoundException('User not found');
      }

      await this.helper.checkRole(email, Role.CONSUMER);

      const orders = await this.prisma.order.findMany({
        where: {
          consumer: {
            userId: user.data!.id,
          },
        },
        include: {
          items: true,
          deliveryOption: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return orders;
    } catch (error) {
      this.logger.error(error);
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        throw new InternalServerErrorException(
          error?.message || 'An error occurred while fetching order details.',
        );
      }
    }
  }
}
