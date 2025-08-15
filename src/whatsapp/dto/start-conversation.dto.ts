import { IsString, IsNotEmpty, IsMongoId, IsOptional } from 'class-validator';

export class StartConversationDto {
  @IsMongoId()
  @IsNotEmpty()
  customerId: string;

  @IsString()
  @IsNotEmpty()
  templateName: string;

  @IsString()
  @IsOptional()
  languageCode?: string;

  @IsString()
  @IsOptional()
  customMessage?: string;
}
