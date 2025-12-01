import { HelpersModule } from './helpers/helpers.module';
import { HelpersService } from './helpers/helpers.service';
import { AuthModule } from './auth/auth.module';
import { AuthService } from './auth/auth.service';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import globalConfig from './config/global.config';
import { MailerModule } from '@nestjs-modules/mailer';
import { join } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    HelpersModule,
    AuthModule,
    ConfigModule.forRoot({ isGlobal: true, load: [globalConfig] }),
    MailerModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: config.get<string>('email.user'),
            pass: config.get<string>('email.pass'),
          },
        },
        defaults: {
          from: `${config.get<string>('app.name')} <${config.get<string>('app.email')}>`,
        },
        template: {
          dir: join(__dirname, '..', 'views'),
          adapter: new HandlebarsAdapter(),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [HelpersService, AuthService, AppService, PrismaService],
})
export class AppModule {}
