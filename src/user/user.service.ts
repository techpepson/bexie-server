import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UserDto } from '../dto/user.dto';
import { HelpersService } from '../helpers/helpers.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../enum/app.enum';

@Injectable()
export class UserService {
  logger = new Logger(UserService.name);
  constructor(
    private readonly helper: HelpersService,
    private readonly prisma: PrismaService,
  ) {}

  async updateConsumerDetails(email: string, payload: Partial<UserDto>) {
    try {
      const user = await this.helper.fetchUser(email);

      //check role
      await this.helper.checkRole(email, Role.CONSUMER || Role.VENDOR);

      //check if user exists
      if (!user.exists) {
        throw new NotFoundException('User not found');
      }

      //update consumer details
      const update = await this.prisma.user.update({
        where: {
          email,
        },
        data: {
          name: payload.name,
          phone: payload.phoneNumber,
          address: payload.address,
          email: payload.email,
          role: Role.CONSUMER,
          preferNewProductNotifications: payload.preferNewProductNotifications,
          region: payload.region,
          preferPromotionalEmails: payload.preferPromotionalEmails,
          paymentMethod: {
            update: {
              card: {
                update: {
                  cardNumber: payload.cardNumber,
                  expiryDate: payload.cardExpiry,
                  cvv: payload.cvv,
                },
              },
              mobileMoney: {
                update: {
                  provider: payload.provider,
                  phoneNumber: payload.phoneNumber,
                },
              },
            },
          },
        },
      });

      return {
        message: 'User details updated successfully',
        data: update,
      };
    } catch (error) {
      this.logger.error(error.message);
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        throw new Error(error.message);
      }
    }
  }

  async getUserNotifications(email: string) {
    try {
      const user = await this.helper.fetchUser(email);

      //check if user exists
      if (!user.exists) {
        throw new NotFoundException('User not found');
      }

      const notifications = await this.prisma.userNotification.findMany({
        where: {
          userId: user.data!.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        message: 'User notifications fetched successfully',
        data: notifications,
      };
    } catch (error) {
      this.logger.error(error.message);
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        throw new Error('Internal server error');
      }
    }
  }

  async updateUserDetails(email: string, payload: Partial<UserDto>) {
    try {
      const user = await this.helper.fetchUser(email);

      //check if user exists
      if (!user.exists) {
        throw new NotFoundException('User not found');
      }

      //update user details
      const update = await this.prisma.user.update({
        where: {
          email,
        },
        data: {
          name: payload.name,
          phone: payload.phoneNumber,
          address: payload.address,
          email: payload.email,
          profilePicture: payload.profilePicture,
          region: payload.region,
        },
      });

      return {
        message: 'User details updated successfully',
        data: update,
      };
    } catch (error) {
      this.logger.error(error.message);
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        throw new Error(error.message);
      }
    }
  }
}
