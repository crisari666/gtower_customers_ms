import { ApiProperty } from '@nestjs/swagger';
import { Customer } from '../entities/customer.entity';

export class BulkCreateCustomerResponseDto {
  @ApiProperty({ description: 'Successfully created customers' })
  created: Customer[];

  @ApiProperty({ description: 'Customers that already exist (not created)' })
  skipped: {
    phone: string;
    reason: string;
  }[];

  @ApiProperty({ description: 'Total customers processed' })
  totalProcessed: number;

  @ApiProperty({ description: 'Number of customers successfully created' })
  createdCount: number;

  @ApiProperty({ description: 'Number of customers skipped' })
  skippedCount: number;
}
