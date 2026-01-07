import { IsNotEmpty, IsString } from 'class-validator';

export class RiderVerificationDto {
  @IsString()
  @IsNotEmpty()
  fullNameOnId: string;

  @IsString()
  @IsNotEmpty()
  idNumber: string;

  @IsString()
  @IsNotEmpty()
  idExpiryDate: string;

  @IsString()
  @IsNotEmpty()
  driverLicenseNumber: string;

  @IsString()
  @IsNotEmpty()
  licenseExpiryDate: string;

  @IsString()
  @IsNotEmpty()
  vehicleRegistrationNumber: string;

  @IsString()
  @IsNotEmpty()
  vehicleType: string;

  @IsString()
  @IsNotEmpty()
  documentType: string;
}
