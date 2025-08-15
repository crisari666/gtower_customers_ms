import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';

export class UpdateMessageDto {
  @IsEnum(['pending', 'sent', 'delivered', 'read', 'failed'])
  @IsOptional()
  status?: string;

  @IsDateString()
  @IsOptional()
  sentAt?: string;

  @IsDateString()
  @IsOptional()
  deliveredAt?: string;

  @IsDateString()
  @IsOptional()
  readAt?: string;
}
