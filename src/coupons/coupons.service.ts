import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCouponDto,
  UpdateCouponDto,
  CouponResponseDto,
} from './coupons.dto';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async createCoupon(
    createCouponDto: CreateCouponDto,
  ): Promise<CouponResponseDto> {
    const {
      code,
      discountType,
      discountAmount,
      validUntil,
      usageLimit,
      ...rest
    } = createCouponDto;

    // Validate coupon code uniqueness
    const existingCoupon = await this.prisma.coupon.findUnique({
      where: { code },
    });

    if (existingCoupon) {
      throw new ConflictException(`Coupon with code "${code}" already exists`);
    }

    // Validate discount type
    if (!['percentage', 'fixed_amount'].includes(discountType)) {
      throw new BadRequestException(
        'Discount type must be either "percentage" or "fixed_amount"',
      );
    }

    // Validate discount amount
    if (
      discountType === 'percentage' &&
      (discountAmount < 0 || discountAmount > 100)
    ) {
      throw new BadRequestException(
        'Percentage discount must be between 0 and 100',
      );
    }

    if (discountAmount < 0) {
      throw new BadRequestException('Discount amount cannot be negative');
    }

    // Validate valid until date
    if (new Date(validUntil) <= new Date()) {
      throw new BadRequestException('Valid until date must be in the future');
    }

    // Validate usage limit
    if (usageLimit < 1) {
      throw new BadRequestException('Usage limit must be at least 1');
    }

    const coupon = await this.prisma.coupon.create({
      data: {
        code,
        discountType,
        discountAmount,
        validUntil: new Date(validUntil),
        usageLimit,
        currentUsage: 0,
        ...rest,
      },
    });

    return this.mapToResponseDto(coupon);
  }

  /**
   * Get all coupons
   */
  async getAllCoupons(email: string): Promise<CouponResponseDto[]> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(`User with email "${email}" not found`);
    }

    const vendor = await this.prisma.vendor.findUnique({
      where: { userId: user.id },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor for user "${email}" not found`);
    }

    const coupons = await this.prisma.coupon.findMany({
      where: {
        vendorId: vendor.userId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return coupons.map((coupon) => this.mapToResponseDto(coupon));
  }

  /**
   * Get a single coupon by ID
   */
  async getCouponById(id: string): Promise<CouponResponseDto> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID "${id}" not found`);
    }

    return this.mapToResponseDto(coupon);
  }

  /**
   * Get a coupon by code
   */
  async getCouponByCode(code: string): Promise<CouponResponseDto> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with code "${code}" not found`);
    }

    return this.mapToResponseDto(coupon);
  }

  /**
   * Update a coupon
   */
  async updateCoupon(
    id: string,
    updateCouponDto: UpdateCouponDto,
  ): Promise<CouponResponseDto> {
    // Verify coupon exists
    const existingCoupon = await this.prisma.coupon.findUnique({
      where: { id },
    });

    if (!existingCoupon) {
      throw new NotFoundException(`Coupon with ID "${id}" not found`);
    }

    // If updating code, check uniqueness
    if (updateCouponDto.code && updateCouponDto.code !== existingCoupon.code) {
      const codeExists = await this.prisma.coupon.findUnique({
        where: { code: updateCouponDto.code },
      });

      if (codeExists) {
        throw new ConflictException(
          `Coupon with code "${updateCouponDto.code}" already exists`,
        );
      }
    }

    // Validate discount type if provided
    if (
      updateCouponDto.discountType &&
      !['percentage', 'fixed_amount'].includes(updateCouponDto.discountType)
    ) {
      throw new BadRequestException(
        'Discount type must be either "percentage" or "fixed_amount"',
      );
    }

    // Validate discount amount if provided
    const discountType =
      updateCouponDto.discountType || existingCoupon.discountType;
    const discountAmount =
      updateCouponDto.discountAmount !== undefined
        ? updateCouponDto.discountAmount
        : existingCoupon.discountAmount;

    if (
      discountType === 'percentage' &&
      (discountAmount < 0 || discountAmount > 100)
    ) {
      throw new BadRequestException(
        'Percentage discount must be between 0 and 100',
      );
    }

    if (discountAmount < 0) {
      throw new BadRequestException('Discount amount cannot be negative');
    }

    // Validate valid until date if provided
    if (
      updateCouponDto.validUntil &&
      new Date(updateCouponDto.validUntil) <= new Date()
    ) {
      throw new BadRequestException('Valid until date must be in the future');
    }

    // Validate usage limit if provided
    if (
      updateCouponDto.usageLimit !== undefined &&
      updateCouponDto.usageLimit < 1
    ) {
      throw new BadRequestException('Usage limit must be at least 1');
    }

    const updateData: any = { ...updateCouponDto };
    if (updateData.validUntil) {
      updateData.validUntil = new Date(updateData.validUntil);
    }

    const updatedCoupon = await this.prisma.coupon.update({
      where: { id },
      data: updateData,
    });

    return this.mapToResponseDto(updatedCoupon);
  }

  /**
   * Delete a coupon
   */
  async deleteCoupon(id: string): Promise<void> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID "${id}" not found`);
    }

    await this.prisma.coupon.delete({
      where: { id },
    });
  }

  /**
   * Validate a coupon and increment usage
   */
  async validateAndUseCoupon(code: string): Promise<CouponResponseDto> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with code "${code}" not found`);
    }

    // Check if coupon is still valid
    if (new Date() > new Date(coupon.validUntil)) {
      throw new BadRequestException('Coupon has expired');
    }

    // Check if usage limit has been reached
    if (coupon.currentUsage >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit has been reached');
    }

    // Increment usage counter
    const updatedCoupon = await this.prisma.coupon.update({
      where: { id: coupon.id },
      data: {
        currentUsage: coupon.currentUsage + 1,
      },
    });

    return this.mapToResponseDto(updatedCoupon);
  }

  /**
   * Get active coupons (not expired and usage limit not reached)
   */
  async getActiveCoupons(): Promise<CouponResponseDto[]> {
    const now = new Date();
    const coupons = await this.prisma.coupon.findMany({
      where: {
        validUntil: {
          gt: now,
        },
      },
    });

    return coupons
      .filter((coupon) => coupon.currentUsage < coupon.usageLimit)
      .map((coupon) => this.mapToResponseDto(coupon));
  }

  /**
   * Map coupon entity to response DTO
   */
  private mapToResponseDto(coupon: any): CouponResponseDto {
    return {
      id: coupon.id,
      title: coupon.title,
      code: coupon.code,
      discountType: coupon.discountType,
      discountAmount: coupon.discountAmount,
      validUntil: coupon.validUntil,
      usageLimit: coupon.usageLimit,
      currentUsage: coupon.currentUsage,
      description: coupon.description,
      firstPurchaseOnly: coupon.firstPurchaseOnly,
      createdAt: coupon.createdAt,
      updatedAt: coupon.updatedAt,
    };
  }
}
