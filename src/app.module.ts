import { OrderModule } from './order/order.module';
import { OrderController } from './order/order.controller';
import { OrderService } from './order/order.service';
import { ProductsModule } from './product/products.module';
import { ProductsController } from './product/products.controller';
import { ProductsService } from './product/products.service';
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
import { JwtService } from '@nestjs/jwt';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    OrderModule,
    ProductsModule,
    HelpersModule,
    AuthModule,
    ConfigModule.forRoot({ isGlobal: true, load: [globalConfig] }),
    MulterModule.register({
      storage: memoryStorage(),
    }),
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
  controllers: [OrderController, ProductsController, AppController],
  providers: [
    OrderService,
    ProductsService,
    HelpersService,
    AuthService,
    AppService,
    PrismaService,
    JwtService,
  ],
})
export class AppModule {}
