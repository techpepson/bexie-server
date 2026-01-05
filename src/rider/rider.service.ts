import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HelpersService } from '../helpers/helpers.service';
import { Role } from '../enum/app.enum';

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
      this.logger.error(error.message);
    }
  }
}
