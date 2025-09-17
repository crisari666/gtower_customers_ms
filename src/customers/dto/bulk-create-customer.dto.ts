import { IsArray, IsNotEmpty, IsString, ValidateNested, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class BulkCustomerDataDto {
  @ApiProperty({ description: 'Customer name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Customer phone number' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: 'Customer country' })
  @IsString()
  @IsNotEmpty()
  country: string;
}

export class BulkCreateCustomerDto {
  @ApiProperty({ 
    description: 'Array of customers to create',
    type: [BulkCustomerDataDto],
    minItems: 1
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkCustomerDataDto)
  customers: BulkCustomerDataDto[];
}
