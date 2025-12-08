import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ShopDto } from '../dto/shop.dto';
import { PrismaService } from '../prisma/prisma.service';
import { HelpersService } from '../helpers/helpers.service';
import { ProductStatus, Role } from '../enum/app.enum';
import { ProductDto } from '../dto/products.dto';

@Injectable()
export class ProductsService {
  logger = new Logger(ProductsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly helper: HelpersService,
  ) {}

  async createShop(payload: ShopDto, email: string) {
    try {
      const user = await this.helper.fetchUser(email);

      //check if user exists
      if (!user.exists) {
        throw new NotFoundException('User account not found');
      }
      //check if the user is a vendor
      await this.helper.checkRole(email, Role.VENDOR);

      //create the vendor shop
      const shop = await this.prisma.shop.create({
        data: {
          name: payload.name,
          description: payload.description,
          location: payload.location,
          contact: payload.contact,
          logo: payload.logo,
          deliveryRange: payload.deliveryRange,
          vendor: {
            connect: {
              userId: user.data!.id,
            },
          },
        },
      });

      return {
        message: 'Shop created successfully',
        shop,
      };
    } catch (error) {
      this.logger.error(error.message);
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof ForbiddenException) {
        throw new ForbiddenException(error.message);
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }

  async createProduct(
    payload: ProductDto,
    email: string,
    files: Express.Multer.File[],
  ) {
    try {
      const user = await this.helper.fetchUser(email);

      if (!user.exists) {
        throw new NotFoundException('User account not found');
      }

      await this.helper.checkRole(email, Role.VENDOR);

      const uploadedImages = await Promise.all(
        files.map((img) => this.helper.uploadImage(img)),
      );

      // Get vendor record
      const vendor = await this.prisma.vendor.findUnique({
        where: { userId: user.data?.id },
        include: { shop: true },
      });

      if (!vendor?.shop) {
        throw new NotFoundException('Shop not created for vendor.');
      }

      const shopId = vendor.shop.id;

      // Create product under the shop
      const product = await this.prisma.shop.update({
        where: { id: shopId },
        data: {
          products: {
            create: {
              name: payload.name,
              description: payload.description,
              color: payload.color,
              images: uploadedImages.map((img) => img.publicId), // <- save uploaded file URLs here later
              category: payload.category,
              price: payload.price,
              quantity: payload.quantity,
              status: ProductStatus.PENDING,
              stockStatus: ProductStatus.IN_STOCK,
              discountAmount: parseFloat(payload.discountedAmount.toString()),
              deliveryOption: {
                create: {
                  type: payload.deliveryType,
                  fee: parseFloat(payload.deliveryFee.toString()),
                  duration: payload.deliveryDuration,
                },
              },
            },
          },
        },
        include: { products: true },
      });

      //create logs for user
      await this.prisma.user.update({
        where: {
          email,
        },
        data: {
          logs: {
            create: {
              title: `Product Addition by ${user.data?.name}`,
              description: `Product with id ${product.id} was created on ${product.createdAt.toString()} by ${user.data?.name}`,
            },
          },
        },
      });
      return {
        message: 'Product added successfully',
        product,
      };
    } catch (error) {
      this.logger.error(error);
      if (error instanceof ForbiddenException) {
        throw new ForbiddenException(error.message);
      } else if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else
        throw new InternalServerErrorException(
          'An internal server error occurred adding product',
        );
    }
  }

  async updateProduct(
    productId: string,
    payload: Partial<ProductDto>,
    email: string,
  ) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
      });

      const user = await this.helper.fetchUser(email);

      await this.helper.checkRole(email, Role.VENDOR);

      if (!user.exists) {
        throw new NotFoundException('User account not found');
      }

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      const updatedProduct = await this.prisma.product.update({
        where: { id: productId },
        data: {
          ...payload,
        },
      });

      return {
        message: 'Product updated successfully',
        product: updatedProduct,
      };
    } catch (error) {
      this.logger.error(error);
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof ForbiddenException) {
        throw new ForbiddenException(error.message);
      } else {
        throw new InternalServerErrorException(
          'An internal server error occurred updating product',
        );
      }
    }
  }

  async deleteProduct(productId: string, email: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
      });

      const user = await this.helper.fetchUser(email);

      await this.helper.checkRole(email, Role.VENDOR);

      if (!user.exists) {
        throw new NotFoundException('User account not found');
      }

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      await this.prisma.product.delete({
        where: { id: productId },
      });

      return {
        message: 'Product deleted successfully',
      };
    } catch (error) {
      this.logger.error(error);
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof ForbiddenException) {
        throw new ForbiddenException(error.message);
      } else {
        throw new InternalServerErrorException(
          'An internal server error occurred deleting product',
        );
      }
    }
  }

  async getAllProducts(email: string) {
    try {
      await this.helper.checkRole(email, Role.MERCHANT);
      const products = await this.prisma.product.findMany();
      return {
        message: 'Products fetched successfully',
        products,
      };
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(
        'An internal server error occurred fetching products',
      );
    }
  }

  async getVendorProducts(email: string) {
    try {
      const user = await this.helper.fetchUser(email);

      await this.helper.checkRole(email, Role.VENDOR);

      if (!user.exists) {
        throw new NotFoundException('User account not found');
      }

      const vendor = await this.prisma.vendor.findUnique({
        where: { userId: user.data!.id },
        include: { shop: { include: { products: true } } },
      });

      if (!vendor?.shop) {
        throw new NotFoundException('Shop not created for vendor.');
      }

      return {
        message: 'Vendor products fetched successfully',
        products: vendor.shop.products,
      };
    } catch (error) {
      this.logger.error(error);
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof ForbiddenException) {
        throw new ForbiddenException(error.message);
      } else {
        throw new InternalServerErrorException(
          'An internal server error occurred fetching vendor products',
        );
      }
    }
  }
}
