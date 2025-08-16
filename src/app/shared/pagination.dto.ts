import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @ApiProperty({ 
    description: 'Page number (1-based)', 
    example: 1, 
    required: false,
    default: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  page?: number = 1;

  @ApiProperty({ 
    description: 'Number of items per page', 
    example: 50, 
    required: false,
    default: 50 
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Min(1)
  limit?: number = 50;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}
