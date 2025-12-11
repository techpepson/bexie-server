import {
  Injectable,
  Logger,
  NotFoundException,
  PreconditionFailedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HelpersService } from '../helpers/helpers.service';
import { OrderStatus, PaymentStatus, Role } from '../enum/app.enum';
import { OrderDto } from '../dto/order.dto';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class OrderService {
  logger = new Logger(OrderService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly helper: HelpersService,
    private readonly payment: PaymentService,
  ) {}

  async placeOrder(email: string, payload: OrderDto) {
    try {
      const user = await this.helper.fetchUser(email);

      if (!user.exists) {
        throw new NotFoundException('User not found.');
      }

      //check user role
      await this.helper.checkRole(email, Role.MERCHANT);

      //create order
      const order = await this.prisma.order.create({
        data: {
          paymentMethod: payload.paymentMethod,
          paymentStatus: PaymentStatus.PENDING,
          address: payload.address,
          contact: payload.contact,
          totalPrice: payload.totalAmount,
          consumer: {
            connect: {
              userId: user.data!.id,
            },
          },
          status: OrderStatus.PENDING,
          items: {
            createMany: {
              data: payload.items.map((item) => ({
                quantity: item.quantity,
                price: item.price,
                productId: item.productId,
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

      //initialize payment here (optional)
      const initPayment = await this.payment.initializePayment(
        email,
        payload.totalAmount,
        payload.paymentMethod,
      );

      if (initPayment.status !== 'success') {
        throw new PreconditionFailedException('Payment initialization failed.');
      }

      //save the reference of payment
      await this.prisma.user.update({
        where: {
          email,
        },
        data: {
          payments: {
            update: {
              initReference: initPayment.reference,
              status: PaymentStatus.PENDING,
              accessCode: initPayment.accessCode,
              amount: payload.totalAmount,
              currency: 'GHS',
              paymentMethod: payload.paymentMethod,
              orderId: order.id,
            },
          },
        },
      });
      return {
        message: 'Order placed successfully',
        order,
        url: initPayment.authorizationUrl,
      };
    } catch (error) {
      this.logger.error(error.message);
    }
  }
}
