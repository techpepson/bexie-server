import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HelpersService } from '../helpers/helpers.service';
import { OrderStatus, PaymentStatus, Role } from '../enum/app.enum';
import { OrderDto } from '../dto/order.dto';

@Injectable()
export class OrderService {
  logger = new Logger(OrderService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly helper: HelpersService,
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

      //send sms to product owners - to be implemented

      return {
        message: 'Order placed successfully',
        order,
      };
    } catch (error) {
      this.logger.error(error.message);
    }
  }
}
