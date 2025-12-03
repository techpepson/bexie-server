import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../enum/app.enum';
import { User } from '../../generated/prisma/client';
import ShortUniqueId from 'short-unique-id';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class HelpersService {
  logger = new Logger(HelpersService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mailer: MailerService,
  ) {}

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

  async sendMail(
    recipient: string,
    context: any,
    template: string,
    subject: string,
  ) {
    try {
      const mail = await this.mailer.sendMail({
        to: recipient,
        subject,
        template,
        context,
      });
      if (mail.accepted.length > 0) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      this.logger.error(`Error sending mail to ${recipient}: ${error}`);
      return false;
    }
  }

  async checkRole(email: string, expectedRole: Role): Promise<User> {
    const user = await this.fetchUser(email);

    if (expectedRole !== user.data?.role) {
      throw new ForbiddenException('Access to service denied');
    }
    return user.data;
  }

  randomCodeGen() {
    const uid = new ShortUniqueId({ dictionary: 'alphanum', length: 6 });
    return uid.rnd();
  }
}
