export class CreateCouponDto {
  title: string;
  code: string;
  discountType: 'percentage' | 'fixed_amount';
  discountAmount: number;
  validUntil: Date;
  usageLimit: number;
  description?: string;
  firstPurchaseOnly?: boolean;
}

export class UpdateCouponDto {
  title?: string;
  code?: string;
  discountType?: 'percentage' | 'fixed_amount';
  discountAmount?: number;
  validUntil?: Date;
  usageLimit?: number;
  description?: string;
  firstPurchaseOnly?: boolean;
}

export class CouponResponseDto {
  id: string;
  title: string;
  code: string;
  discountType: string;
  discountAmount: number;
  validUntil: Date;
  usageLimit: number;
  currentUsage: number;
  description?: string;
  firstPurchaseOnly: boolean;
  createdAt: Date;
  updatedAt: Date;
}
