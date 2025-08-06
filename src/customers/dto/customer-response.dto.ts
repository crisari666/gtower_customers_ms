import { ApiProperty } from '@nestjs/swagger';

export class CustomerResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false })
  whatsapp?: string;

  @ApiProperty({ required: false })
  address?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
} 