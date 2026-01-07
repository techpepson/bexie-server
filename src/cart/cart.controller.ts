import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @UseGuards(JwtAuthGuard)
  @Post('add-to-cart')
  async addToCart(@Body('productId') productId: string, @Req() req: Request) {
    const email = (req.user as any)?.email;
    const result = await this.cartService.addToCart(email, productId);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('cart-items')
  async getCartItems(@Req() req: Request) {
    const email = (req.user as any)?.email;
    const cart = await this.cartService.getCartItems(email);
    return cart;
  }

  @UseGuards(JwtAuthGuard)
  @Post('remove-from-cart')
  async removeFromCart(@Body('cartId') cartId: string, @Req() req: Request) {
    const email = (req.user as any)?.email;
    const result = await this.cartService.removeFromCart(email, cartId);
    return result;
  }
}
