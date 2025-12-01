import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../enum/app.enum';
import { User } from '../../generated/prisma/client';

@Injectable()
export class HelpersService {
  constructor(private readonly prisma: PrismaService) {}

  async fetchUser(
    email: string,
  ): Promise<{ exists: boolean; data: User | null }> {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return {
        exists: false,
        data: user,
      };
    } else {
      return {
        exists: true,
        data: user,
      };
    }
  }

  async checkRole(email: string, expectedRole: Role): Promise<User> {
    const user = await this.fetchUser(email);

    if (expectedRole !== user.data?.role) {
      throw new ForbiddenException('Access to service denied');
    }
    return user.data;
  }
}
