export enum Role {
  VENDOR = 'vendor',
  SYSTEM_ADMIN = 'system_admin',
  ADMIN = 'admin',
  MERCHANT = 'merchant',
  RIDER = 'rider',
  CONSUMER = 'consumer',
}

export enum currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  NGN = 'NGN',
  GHS = 'GHS',
  KES = 'KES',
  ZAR = 'ZAR',
}

export enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

export enum PasswordResetChannel {
  EMAIL = 'email',
  SMS = 'sms',
}

export enum ProductStatus {
  IN_STOCK = 'in_stock',
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum ProductSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  EXTRA_LARGE = 'extra_large',
}

export enum ProductCategory {
  ELECTRONICS_AND_GADGETS = 'electronics_and_gadgets',
  FASHION_AND_APPAREL = 'fashion_and_apparel',
  BEAUTY_AND_PERSONAL_CARE = 'beauty_and_personal_care',
  SPORTS_AND_OUTDOORS = 'sports_and_outdoors',
  HOME_AND_LIVING = 'home_and_living',
  AUTOMOTIVE = 'automotive',
  HEALTH_AND_WELLNESS = 'health_and_wellness',
  BABY_AND_KIDS = 'baby_and_kids',
  FASHION = 'fashion',
  HOME_APPLIANCES = 'home_appliances',
  BOOKS_AND_STATIONERY = 'books_and_stationery',
  TOYS = 'toys',
  GROCERIES = 'groceries',
  FOOD = 'food',
  SERVICES = 'services',
  OTHERS = 'others',
}

export enum FoodCategory {
  FAST_FOOD = 'fast_food',
  VEGETARIAN = 'vegetarian',
  VEGAN = 'vegan',
  DESSERTS = 'desserts',
  BEVERAGES = 'beverages',
  SEAFOOD = 'seafood',
  GRILLED = 'grilled',
  SALADS = 'salads',
  SOUPS = 'soups',
  PASTA = 'pasta',
  PIZZA = 'pizza',
  SANDWICHES = 'sandwiches',
  BREAKFAST = 'breakfast',
  SNACKS = 'snacks',
  INTERNATIONAL_CUISINE = 'international_cuisine',
}

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}
export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  MOBILE_MONEY = 'mobile_money',
  DEBIT_CARD = 'debit_card',
  PAYPAL = 'paypal',
  BANK_TRANSFER = 'bank_transfer',
  CASH_ON_DELIVERY = 'cash_on_delivery',
}

export enum DeliveryType {
  STANDARD = 'standard',
  EXPRESS = 'express',
  OTHER = 'other',
}

export enum UnitOfDelivery {
  DAYS = 'days',
  HOURS = 'hours',
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
}
