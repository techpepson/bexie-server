import { IsNotEmpty, IsString } from 'class-validator';

export class ShopDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  contact: string;

  @IsString()
  @IsNotEmpty()
  deliveryRange: number;

  @IsString()
  @IsNotEmpty()
  logo: string;
}
