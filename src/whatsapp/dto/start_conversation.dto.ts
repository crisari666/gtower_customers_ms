import { IsString, IsNotEmpty } from 'class-validator';

export class StartConversationCartagenaDto {
  @IsString()
  @IsNotEmpty()
  customerName: string;
}
