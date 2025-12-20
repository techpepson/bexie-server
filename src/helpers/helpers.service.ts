import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../enum/app.enum';
import { User } from '../../generated/prisma/client';
import ShortUniqueId from 'short-unique-id';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import cloudinary from '../config/cloudinary.config';

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

    if (user.data?.role !== expectedRole) {
      throw new ForbiddenException('Access to service denied');
    }
    return user.data;
  }

  randomCodeGen() {
    const uid = new ShortUniqueId({ dictionary: 'alphanum', length: 6 });
    return uid.rnd();
  }

  async uploadImage(file: Express.Multer.File) {
    try {
      const originalName = file.originalname;
      const allowedExtensions = ['jpeg', 'jpg', 'png', 'mpeg'];

      const options = {
        use_filename: true,
        unique_filename: false,
        overwrite: true,
      };

      const ext = originalName.split('.').pop();

      if (!ext) {
        throw new NotFoundException('Extension not found');
      }

      //check if buffer exists
      if (!file.buffer) {
        throw new BadRequestException('File buffer not valid or not provided');
      }
      //check if extension is in allowed extensions
      if (!allowedExtensions.includes(ext)) {
        throw new NotAcceptableException('Unsupported extension received');
      }

      const base64String = Buffer.from(file.buffer).toString('base64');
      const mimeType = file.mimetype;
      const dataUri = `data:${mimeType};base64,${base64String}`;

      // Upload the image
      const result = await cloudinary.uploader.upload(dataUri, options);
      return {
        publicId: result.public_id,
      };
    } catch (error) {
      this.logger.error(error);
      if (error instanceof NotFoundException) {
        throw new NotFoundException('File buffer not found');
      } else if (error instanceof BadRequestException) {
        throw new BadRequestException('Bad request received');
      } else {
        throw new InternalServerErrorException(
          `An internal server error occurred while uploading image:${error.message} `,
        );
      }
    }
  }

  inferMomoProvider(phone: string): 'MTN' | 'VOD' | 'ATL' {
    try {
      const prefix = phone.substring(0, 3);

      if (['024', '054', '055', '059'].includes(prefix)) return 'MTN';
      if (['020', '050'].includes(prefix)) return 'VOD';
      if (['027', '057', '026', '056'].includes(prefix)) return 'ATL';

      throw new Error('Unsupported mobile money provider');
    } catch (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException(
        'Error inferring mobile money provider',
      );
    }
  }

  async createUserLogs(
    email: string,
    message: string,
    createdAt?: Date,
    description?: string,
  ) {
    try {
      const user = await this.fetchUser(email);

      if (!user.exists) {
        throw new NotFoundException('User not found');
      }

      const logs = await this.prisma.user.update({
        where: {
          email,
        },
        data: {
          logs: {
            create: {
              title: message,
              description:
                description ?? `Log created on ${createdAt?.toString()}`,
            },
          },
        },
      });

      return logs;
    } catch (error) {
      this.logger.error(error);
    }
  }
}
