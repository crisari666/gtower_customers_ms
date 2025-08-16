import { ApiProperty } from '@nestjs/swagger';
import { Message } from '../../whatsapp/entities/message.entity';

export class ConversationMessagesResponseDto {
  @ApiProperty({ description: 'List of messages', type: [Message] })
  messages: Message[];

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of messages' })
  total: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPreviousPage: boolean;
}
