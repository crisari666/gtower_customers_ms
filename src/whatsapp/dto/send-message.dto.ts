import { IsString, IsNotEmpty, IsPhoneNumber } from 'class-validator';

export class SendMessageDto {
  @IsPhoneNumber()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
