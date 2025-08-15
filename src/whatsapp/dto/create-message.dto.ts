import { IsString, IsNotEmpty, IsMongoId, IsOptional, IsEnum, IsObject, IsBoolean } from 'class-validator';

export class CreateMessageDto {
  @IsMongoId()
  @IsNotEmpty()
  conversationId: string;

  @IsMongoId()
  @IsNotEmpty()
  customerId: string;

  @IsString()
  @IsNotEmpty()
  whatsappNumber: string;

  @IsString()
  @IsNotEmpty()
  whatsappMessageId: string;

  @IsEnum(['agent', 'customer'])
  @IsNotEmpty()
  senderType: string;

  @IsEnum(['text', 'template', 'image', 'audio', 'video', 'document'])
  @IsNotEmpty()
  messageType: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(['pending', 'sent', 'delivered', 'read', 'failed'])
  @IsOptional()
  status?: string;

  @IsBoolean()
  @IsOptional()
  isTemplate?: boolean;

  @IsString()
  @IsOptional()
  templateName?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
