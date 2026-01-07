import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HelpersService } from '../helpers/helpers.service';
import { DeliveryStatus, RiderStatus, Role } from '../enum/app.enum';
import { RiderVerificationDto } from '../dto/rider-verification.dto';

@Injectable()
export class RiderService {
  logger = new Logger(RiderService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly helper: HelpersService,
  ) {}

  async fetchRiderDetails(email: string, riderId: string) {
    try {
      const rider = await this.prisma.rider.findUnique({
        where: { id: riderId },
      });

      //check if rider exists
      if (!rider) {
        throw new NotFoundException('Rider not found');
      }

      //check role of user
      await this.helper.checkRider(email, Role.RIDER);

      return {
        message: 'Rider details fetched successfully',
        rider,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof ForbiddenException) {
        throw new ForbiddenException(error.message);
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }

  async acceptOrder(email: string, riderId: string, orderId: string) {
    try {
      //check role of user
      await this.helper.checkRider(email, Role.RIDER);

      //check if rider exists
      const rider = await this.prisma.rider.findUnique({
        where: { id: riderId },
      });

      if (!rider) {
        throw new NotFoundException('Rider not found');
      }

      //update order with riderId and change status to accepted
      const order = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          deliveryStatus: DeliveryStatus.PICKED_UP,
          rider: {
            connect: { id: riderId },
          },
        },
      });

      return {
        message: 'Order accepted successfully',
        order,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof ForbiddenException) {
        throw new ForbiddenException(error.message);
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }

  async completeDelivery(email: string, riderId: string, orderId: string) {
    try {
      //check role of user
      await this.helper.checkRider(email, Role.RIDER);

      //check if rider exists
      const rider = await this.prisma.rider.findUnique({
        where: { id: riderId },
      });

      if (!rider) {
        throw new NotFoundException('Rider not found');
      }

      //update order status to delivered
      const order = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          deliveryStatus: DeliveryStatus.DELIVERED,
        },
      });

      return {
        message: 'Delivery completed successfully',
        order,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof ForbiddenException) {
        throw new ForbiddenException(error.message);
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }

  async fetchRiderOrders(email: string, riderId: string) {
    try {
      //check role of user
      await this.helper.checkRider(email, Role.RIDER);

      //check if rider exists
      const rider = await this.prisma.rider.findUnique({
        where: { id: riderId },
      });

      if (!rider) {
        throw new NotFoundException('Rider not found');
      }

      //fetch orders assigned to rider
      const orders = await this.prisma.order.findMany({
        where: { riderId: riderId },
        include: {
          items: true,
          deliveryOption: true,
          consumer: true,
          reviews: true,
        },
      });

      return {
        message: 'Rider orders fetched successfully',
        orders,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof ForbiddenException) {
        throw new ForbiddenException(error.message);
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }

  async fetchRiderEarnings(email: string, riderId: string) {
    try {
      //check role of user
      await this.helper.checkRider(email, Role.RIDER);

      //check if rider exists
      const rider = await this.prisma.rider.findUnique({
        where: { id: riderId },
      });

      if (!rider) {
        throw new NotFoundException('Rider not found');
      }

      //calculate total earnings from delivered orders
      const earnings = await this.prisma.order.aggregate({
        where: {
          riderId: riderId,
          deliveryStatus: DeliveryStatus.DELIVERED,
        },
        _sum: {
          deliveryFee: true,
        },
      });

      return {
        message: 'Rider earnings fetched successfully',
        totalEarnings: earnings._sum.deliveryFee || 0,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof ForbiddenException) {
        throw new ForbiddenException(error.message);
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }

  async fetchRiderNotifications(email: string, riderId: string) {
    try {
      //check role of user
      await this.helper.checkRider(email, Role.RIDER);

      //check if rider exists
      const rider = await this.prisma.rider.findUnique({
        where: { id: riderId },
      });

      if (!rider) {
        throw new NotFoundException('Rider not found');
      }

      //fetch notifications for rider
      const notifications = await this.prisma.userNotification.findMany({
        where: { riderId: riderId },
        orderBy: { createdAt: 'desc' },
      });

      return {
        message: 'Rider notifications fetched successfully',
        notifications,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof ForbiddenException) {
        throw new ForbiddenException(error.message);
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }

  async riderVerification(
    files: Express.Multer.File[],
    email: string,
    riderId: string,
    payload: RiderVerificationDto,
  ) {
    try {
      let passportPhotoUrl = '';
      let frontOfIdCardUrl = '';
      let backOfIdCardUrl = '';

      //check role of user
      await this.helper.checkRider(email, Role.RIDER);

      //check if rider exists
      const rider = await this.prisma.rider.findUnique({
        where: { id: riderId },
      });

      if (!rider) {
        throw new NotFoundException('Rider not found');
      }

      //upload rider documents
      await Promise.all(
        files.map(async (file) => {
          const imageUrl = await this.helper.uploadImage(file);
          if (file.fieldname === 'passportPhoto') {
            passportPhotoUrl = imageUrl.publicId;
          } else if (file.fieldname === 'frontOfIdCard') {
            frontOfIdCardUrl = imageUrl.publicId;
          } else if (file.fieldname === 'backOfIdCard') {
            backOfIdCardUrl = imageUrl.publicId;
          }
        }),
      );

      //update rider profile with verification details
      await this.prisma.rider.update({
        where: { id: riderId },
        data: {
          verification: {
            create: {
              idNumber: payload.idNumber,
              documentType: payload.documentType,
              vehicleType: payload.vehicleType,
              vehicleNumber: payload.vehicleRegistrationNumber,
              frontOfIdCard: frontOfIdCardUrl,
              backOfIdCard: backOfIdCardUrl,
              passportPhoto: passportPhotoUrl,
              status: RiderStatus.PENDING,
              licenseNumber: payload.driverLicenseNumber,
              fullNameOnId: payload.fullNameOnId,
              idExpiryDate: payload.idExpiryDate,
            },
          },
        },
      });
      return {
        message: 'Rider verification submitted successful',
        rider,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof ForbiddenException) {
        throw new ForbiddenException(error.message);
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }
}
