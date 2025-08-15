import { IsString, IsNotEmpty, IsMongoId, IsOptional, IsEnum } from 'class-validator';

export class CreateConversationDto {
  @IsMongoId()
  @IsNotEmpty()
  customerId: string;

  @IsString()
  @IsNotEmpty()
  whatsappNumber: string;

  @IsString()
  @IsOptional()
  conversationId?: string;

  @IsEnum(['active', 'closed', 'archived'])
  @IsOptional()
  status?: string;
}
