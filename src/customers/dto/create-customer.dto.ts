import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ required: false, description: 'Customer name' })
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty({ description: 'Customer phone number' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ required: false, description: 'Customer email address' })
  @IsEmail()
  @IsOptional()
  email: string;

  @ApiProperty({ required: false, description: 'Customer WhatsApp number' })
  @IsString()
  @IsOptional()
  whatsapp?: string;

  @ApiProperty({ required: false, description: 'Customer address' })
  @IsString()
  @IsOptional()
  address?: string;
}
