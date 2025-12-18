import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HelpersService } from '../helpers/helpers.service';

@Injectable()
export class WishlistService {
  logger = new Logger(WishlistService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly helpers: HelpersService,
  ) {}

  async addToWishlist(email: string, productId: string) {
    try {
      const user = await this.helpers.fetchUser(email);

      if (!user.exists) {
        throw new NotFoundException('User not found');
      }

      const product = await this.prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      //check if user is a consumer
      const consumer = await this.prisma.consumer.findUnique({
        where: {
          userId: user.data!.id,
        },
      });

      if (!consumer) {
        throw new NotFoundException('User not a consumer');
      }

      //check if product is already in wishlist
      const wishlistExist = await this.prisma.wishlist.findUnique({
        where: {
          consumerId_productId: {
            consumerId: consumer.userId,
            productId: productId,
          },
        },
      });

      if (wishlistExist) {
        throw new ConflictException('Item already added to wishlist');
      }

      //add product to wishlist
      await this.prisma.wishlist.create({
        data: {
          consumerId: consumer.userId,
          productId: productId,
        },
      });

      return {
        message: 'Product added to wishlist successfully',
      };
    } catch (error) {
      this.logger.error(error);
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      } else {
        throw new BadRequestException('Could not add to wishlist');
      }
    }
  }

  async fetchWishlistItems(email: string) {
    try {
      const user = await this.helpers.fetchUser(email);

      if (!user.exists) {
        throw new NotFoundException('User not found');
      }

      const consumer = await this.prisma.consumer.findUnique({
        where: {
          userId: user.data!.id,
        },
      });

      if (!consumer) {
        throw new NotFoundException('Consumer not found');
      }
      const wishlists = await this.prisma.wishlist.findMany({
        where: {
          consumerId: consumer?.userId,
        },
        include: {
          product: true,
        },
      });

      return wishlists.map((item) => item.product);
    } catch (error) {
      this.logger.error(error);
      if (error instanceof NotFoundException) {
        throw new NotFoundException('An error occurred finding a model');
      } else {
        throw new InternalServerErrorException(
          'An internal server error occurred',
        );
      }
    }
  }

  async removeFromWishlist(email: string, wishlistId: string) {
    try {
      const user = await this.helpers.fetchUser(email);

      if (!user.exists) {
        throw new NotFoundException('User not found');
      }

      const wishlist = await this.prisma.wishlist.findUnique({
        where: {
          id: wishlistId,
        },
      });

      if (!wishlist) {
        throw new NotFoundException('Wishlist does not exist');
      }

      //delete from wishlist
      await this.prisma.wishlist.delete({
        where: {
          id: wishlistId,
        },
      });
    } catch (error) {
      this.logger.error(error);
      if (error instanceof NotFoundException) {
        throw new NotFoundException('An exception occurrred locatiing model');
      } else {
        throw new InternalServerErrorException(
          'An internal server error exception occurred',
        );
      }
    }
  }

  async addToRecentlyWatched(email: string, productId: string) {
    try {
      const user = await this.helpers.fetchUser(email);

      if (!user.exists) {
        throw new NotFoundException('User not found');
      }

      const product = await this.prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      //check if user is a consumer
      const consumer = await this.prisma.consumer.findUnique({
        where: {
          userId: user.data!.id,
        },
      });

      if (!consumer) {
        throw new NotFoundException('User not a consumer');
      }

      //check if product is already in wishlist
      const watchExist = await this.prisma.recentlyWatched.findUnique({
        where: {
          productId_userId: {
            userId: consumer.userId,
            productId: productId,
          },
        },
      });

      if (watchExist) {
        return;
      }

      //add product to wishlist
      await this.prisma.recentlyWatched.create({
        data: {
          userId: consumer.userId,
          productId: productId,
        },
      });

      return {
        message: 'Product added to wishlist successfully',
      };
    } catch (error) {
      this.logger.error(error);
    }
  }

  async fetchRecentlyWatched(email: string) {
    try {
      try {
        const user = await this.helpers.fetchUser(email);

        if (!user.exists) {
          throw new NotFoundException('User not found');
        }

        const consumer = await this.prisma.consumer.findUnique({
          where: {
            userId: user.data!.id,
          },
        });

        if (!consumer) {
          throw new NotFoundException('Consumer not found');
        }
        const recentWatched = await this.prisma.recentlyWatched.findMany({
          where: {
            userId: consumer?.userId,
          },
          include: {
            product: true,
          },
        });

        return recentWatched.map((item) => item.product);
      } catch (error) {
        this.logger.error(error);
        if (error instanceof NotFoundException) {
          throw new NotFoundException('An error occurred finding a model');
        } else {
          throw new InternalServerErrorException(
            'An internal server error occurred',
          );
        }
      }
    } catch (error) {
      this.logger.error(error);
    }
  }
}
