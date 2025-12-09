import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HelpersService } from '../helpers/helpers.service';
import { Role } from '../enum/app.enum';

@Injectable()
export class CartService {
  logger = new Logger();
  constructor(
    private readonly prisma: PrismaService,
    private readonly helper: HelpersService,
  ) {}

  async addToCart(email: string, productId: string) {
    try {
      const user = await this.helper.fetchUser(email);

      if (!user.exists) {
        throw new NotFoundException('User not found.');
      }

      //check user role
      await this.helper.checkRole(email, Role.MERCHANT);

      //get product from db
      const product = await this.prisma.product.findUnique({
        where: {
          id: productId,
        },
      });

      //check if product exists
      if (!product) {
        throw new NotFoundException('Product does not exist');
      }

      //add product to cart
      await this.prisma.cart.create({
        data: {
          products: {
            connect: {
              id: productId,
            },
          },
          consumer: {
            connect: {
              userId: user.data!.id,
            },
          },
        },
      });

      //add cart activity to logs
      await this.prisma.user.update({
        where: {
          email,
        },
        data: {
          logs: {
            create: {
              title: `Added ${product.name} to cart`,
              description: `You successfully added ${product.name} to your cart on ${new Date().toLocaleString()}.`,
            },
          },
        },
      });

      return {
        message: 'Product added to cart successfully',
      };
    } catch (error) {
      this.logger.error(error);
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof ForbiddenException) {
        throw new ForbiddenException(error.message);
      } else {
        throw new InternalServerErrorException(
          'An internal server error occurred adding item to cart',
        );
      }
    }
  }

  async getCartItems(email: string) {
    try {
      const user = await this.helper.fetchUser(email);

      if (!user.exists) {
        throw new NotFoundException('User not found.');
      }

      //check user role
      await this.helper.checkRole(email, Role.MERCHANT);

      const cart = await this.prisma.cart.findUnique({
        where: {
          consumerId: user.data!.id,
        },
        include: {
          products: true,
        },
      });
      return cart;
    } catch (error) {
      this.logger.error(error);
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof ForbiddenException) {
        throw new ForbiddenException(error.message);
      } else {
        throw new InternalServerErrorException(
          'An internal server error occurred fetching cart items',
        );
      }
    }
  }
  async removeFromCart(email: string, cartId: string) {
    try {
      const user = await this.helper.fetchUser(email);

      if (!user.exists) {
        throw new NotFoundException('User not found.');
      }

      //check user role
      await this.helper.checkRole(email, Role.MERCHANT);
      await this.prisma.cart.delete({ where: { id: cartId } });
    } catch (error) {
      this.logger.error(error);
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof ForbiddenException) {
        throw new ForbiddenException(error.message);
      } else {
        throw new InternalServerErrorException(
          'An internal server error occurred removing item from cart',
        );
      }
    }
  }
}
