import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { DeliveryType, PaymentMethod, UnitOfDelivery } from '../enum/app.enum';
import { Type } from 'class-transformer';

export class OrderDto {
  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  contact: string;

  @IsNumber()
  @IsNotEmpty()
  totalAmount: number;

  @IsEnum(DeliveryType)
  @IsNotEmpty()
  deliveryType: DeliveryType;

  @IsNumber()
  @IsNotEmpty()
  deliveryFee: number;

  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  @IsArray()
  @IsNotEmpty()
  items: ItemDto[];

  @IsEnum(UnitOfDelivery)
  @IsNotEmpty()
  unitOfDelivery: UnitOfDelivery;

  @IsNumber()
  @IsNotEmpty()
  deliveryDuration: number;
}

class ItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @IsNotEmpty()
  price: number;
}
