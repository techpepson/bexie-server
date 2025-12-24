import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Role } from '../enum/app.enum';

export class AdminDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
