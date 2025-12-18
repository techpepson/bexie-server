import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { HelpersService } from '../helpers/helpers.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
  logger = new Logger(NotificationService.name);
  constructor(
    private readonly helpers: HelpersService,
    private readonly prisma: PrismaService,
  ) {}

  async getConsumerNotifications(email: string) {
    try {
      const user = await this.helpers.fetchUser(email);

      if (!user.exists) {
        throw new NotFoundException('User not found');
      }

      const notifications = await this.prisma.user.findUnique({
        where: {
          id: user.data?.id,
        },
        select: {
          userNotifications: true,
        },
      });

      return notifications;
    } catch (error) {
      this.logger.error(error);
      if (error instanceof NotFoundException) {
        throw new NotFoundException('Model not found');
      } else {
        throw new InternalServerErrorException(
          'An internal server error occurred',
        );
      }
    }
  }
}
