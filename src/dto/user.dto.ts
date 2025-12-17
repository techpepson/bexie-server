import { IsBoolean, IsDate, IsString } from 'class-validator';

export class UserDto {
  @IsString()
  name: string;

  @IsString()
  email: string;

  @IsString()
  password: string;

  @IsBoolean()
  isActive: boolean;

  @IsString()
  address: string;

  @IsBoolean()
  preferPromotionalEmails: boolean;

  @IsBoolean()
  preferNewProductNotifications: boolean;

  @IsBoolean()
  preferOrderNotifications: boolean;

  @IsString()
  region: string;

  @IsString()
  provider: string;

  @IsString()
  phoneNumber: string;

  @IsString()
  bankCode: string;

  @IsString()
  cardNumber: string;

  @IsDate()
  cardExpiry: string;

  @IsString()
  cvv: string;
}
