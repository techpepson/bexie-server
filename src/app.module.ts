import { NotificationModule } from './notifications/notification.module';
import { NotificationService } from './notifications/notification.service';
import { NotificationController } from './notifications/notification.controller';
import { WishlistModule } from './wishlist/wishlist.module';
import { UserModule } from './user/user.module';
import { UserService } from './user/user.service';
import { UserController } from './user/user.controller';
import { EarningModule } from './earning/earning.module';
import { EarningService } from './earning/earning.service';
import { EarningController } from './earning/earning.controller';
import { WalletModule } from './wallet/wallet.module';
import { ProcessorModule } from './processors/processor.module';
import { AdminModule } from './admin/admin.module';
import { PaymentModule } from './payment/payment.module';
import { PaymentService } from './payment/payment.service';
import { CartModule } from './cart/cart.module';
import { CartService } from './cart/cart.service';
import { CartController } from './cart/cart.controller';
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
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    NotificationModule,
    WishlistModule,
    UserModule,
    EarningModule,
    WalletModule,
    ConfigModule.forRoot({ isGlobal: true, load: [globalConfig] }),
    ProcessorModule,
    AdminModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST'),
          port: config.get<number>('REDIS_PORT'),
          password: config.get<string>('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'payment',
    }),
    PaymentModule,
    CartModule,
    OrderModule,
    ProductsModule,
    HelpersModule,
    AuthModule,

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
  controllers: [
    NotificationController,
    UserController,
    EarningController,
    CartController,
    OrderController,
    ProductsController,
    AppController,
  ],
  providers: [
    NotificationService,
    UserService,
    EarningService,
    PaymentService,
    CartService,
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
