/*
https://docs.nestjs.com/providers#services
*/

import {
  BadGatewayException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from '../dto/auth.dto';
import { HelpersService } from '../helpers/helpers.service';
import bcrypt from 'bcrypt';
import { PasswordResetChannel, Status } from '../enum/app.enum';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  logger = new Logger(AuthService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly helpers: HelpersService,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  async register(payload: RegisterDto) {
    try {
      const user = await this.helpers.fetchUser(payload.email);

      //check if user exists
      if (user.exists) {
        throw new ConflictException('User account already exists.');
      }

      //hash user password
      const hashedPassword = await bcrypt.hash(payload.password, 10);

      const token = this.helpers.randomCodeGen();

      //hash token
      const hashedToken = await bcrypt.hash(token, 10);

      const appName = this.config.get<string>('app.name');
      const appEnv = this.config.get<string>('app.environment');
      const devBaseUrl = this.config.get<string>('app.devBaseUrl');
      const prodBaseUrl = this.config.get<string>('app.prodBaseUrl');

      const verificationUrl =
        appEnv == 'production'
          ? `${prodBaseUrl}/auth/verify-email?token=${hashedToken}&email=${payload.email}`
          : `${devBaseUrl}/auth/verify-email?token=${hashedToken}&email=${payload.email}`;

      const mail = await this.helpers.sendMail(
        payload.email,
        {
          name: payload.name,
          verificationUrl,
          appName,
        },
        'email-verification',
        `Welcome to ${appName} - Verify your email`,
      );

      //check if mail was sent
      if (!mail) {
        throw new BadGatewayException(
          'Error sending verification email. Please try again.',
        );
      } else {
        //store the token
        await this.prisma.user.create({
          data: {
            emailVerificationToke: hashedToken,
            email: payload.email,
            phone: payload.phone,
            name: payload.name,
            password: hashedPassword,
            role: payload.role,
            status: Status.PENDING,
          },
        });

        return {
          message: 'Registration successful. Please verify your email.',
        };
      }
    } catch (error) {
      this.logger.log(`Registration error: ${error}`);
      if (error instanceof ConflictException) {
        throw new ConflictException(error.message);
      } else if (error instanceof BadGatewayException) {
        throw new BadGatewayException(error.message);
      } else {
        throw new InternalServerErrorException(
          `An error occurred during registration. Please try again.`,
        );
      }
    }
  }

  async verifyEmail(token: string, email: string) {
    try {
      const user = await this.helpers.fetchUser(email);

      //check if user exists
      if (!user.exists) {
        throw new ConflictException('User account does not exist.');
      }

      //check if token matches
      if (user.data?.isEmailVerified) {
        throw new ConflictException('Email already verified.');
      }

      const dbToken = user.data?.emailVerificationToke;

      const compareToken = await bcrypt.compare(token, dbToken!);

      //compare tokens
      if (!compareToken) {
        throw new ConflictException('Invalid verification token.');
      }

      //update user to verified
      await this.prisma.user.update({
        where: {
          email,
        },
        data: {
          isEmailVerified: true,
          emailVerificationToke: null,
        },
      });

      return {
        message: 'Email verified successfully.',
        success: true,
      };
    } catch (error) {
      this.logger.error(`Email verification error: ${error}`);
      if (error instanceof ConflictException) {
        throw new ConflictException(error.message);
      } else {
        throw new InternalServerErrorException(
          `An error occurred during email verification. Please try again.`,
        );
      }
    }
  }

  async login(payload: LoginDto) {
    try {
      const user = await this.helpers.fetchUser(payload.email);

      //check if user exists
      if (!user.exists) {
        throw new ConflictException('Invalid login credentials.');
      }

      const passwordMatch = await bcrypt.compare(
        payload.password,
        user.data!.password,
      );

      if (!passwordMatch) {
        throw new ConflictException('Invalid login credentials.');
      }

      if (!user.data!.isEmailVerified) {
        throw new ConflictException('Email not verified. Please verify email.');
      }

      //change the user's first time login to false
      if (user.data?.isFirstTimeUser) {
        await this.prisma.user.update({
          where: {
            email: payload.email,
          },
          data: {
            isFirstTimeUser: false,
          },
        });
      }

      const token = this.jwt.sign({
        id: user.data?.id,
        email: user.data?.email,
      });
      return {
        message: 'Login successful.',
        user: {
          id: user.data!.id,
          name: user.data!.name,
          email: user.data!.email,
          role: user.data!.role,
          token: token,
          isFirstTimeUser: user.data!.isFirstTimeUser,
        },
      };
    } catch (error) {
      this.logger.error(`Login error: ${error}`);
      if (error instanceof ConflictException) {
        throw new ConflictException(error.message);
      } else {
        throw new InternalServerErrorException(
          `An error occurred during login. Please try again.`,
        );
      }
    }
  }

  async checkPasswordEquality(oldPassword: string, email: string) {
    try {
      const user = await this.helpers.fetchUser(email);

      if (!user.exists) {
        throw new NotFoundException('User account does not exist.');
      }

      const passwordMatch = await bcrypt.compare(
        oldPassword,
        user.data!.password,
      );

      //check if the password match old one
      if (!passwordMatch) {
        throw new ConflictException('Invalid password provided.');
      }
    } catch (error) {
      this.logger.error(`Password check error: ${error}`);
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof ConflictException) {
        throw new ConflictException(error.message);
      } else {
        throw new InternalServerErrorException(
          `An error occurred while checking password. Please try again.`,
        );
      }
    }
  }

  async requestToken(channel: PasswordResetChannel, email: string) {
    try {
      const user = await this.helpers.fetchUser(email);

      //check if user exists
      if (!user.exists) {
        throw new NotFoundException('User account does not exist.');
      }

      const token = this.helpers.randomCodeGen();

      if (channel === PasswordResetChannel.EMAIL) {
        const name = user.data!.name;
        const appName = this.config.get<string>('app.name');
        const expiresIn = 30; //minutes
        const supportEmail = this.config.get<string>('app.email');

        const mail = await this.helpers.sendMail(
          email,
          {
            name,
            token,
            expiresIn,
            appName,
            supportEmail,
          },
          'password-reset',
          `${appName} - Password Reset Token`,
        );

        if (!mail) {
          throw new BadGatewayException(
            'Error sending password reset token email. Please try again.',
          );
        } else {
          await this.prisma.user.update({
            where: {
              email,
            },
            data: {
              passwordResetToken: token,
            },
          });

          return {
            message: 'Password reset token sent to your email.',
          };
        }
      }
    } catch (error) {
      this.logger.error(`Password reset token request error: ${error}`);
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        throw new InternalServerErrorException(
          `An error occurred while requesting password reset token. Please try again.`,
        );
      }
    }
  }

  async verifyPasswordToken(token: string, email: string, newPassword: string) {
    try {
      const user = await this.helpers.fetchUser(email);

      if (!user.exists) {
        throw new NotFoundException('User account not found');
      }

      const resetToken = user.data?.passwordResetToken;

      if (token !== resetToken) {
        throw new UnauthorizedException(
          'Wrong token provided. Please try again.',
        );
      }

      //hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      //update the password
      await this.prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
        },
      });
    } catch (error) {
      this.logger.error(`Password reset error: ${error}`);
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException(error.message);
      } else {
        this.logger.error(`Password reset error: ${error}`);
        throw new InternalServerErrorException(
          `An error occurred while resetting password. Please try again.`,
        );
      }
    }
  }
}
