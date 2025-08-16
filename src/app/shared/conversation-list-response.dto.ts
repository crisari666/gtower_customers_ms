import { ApiProperty } from '@nestjs/swagger';

export class ConversationListItemDto {
  @ApiProperty({ description: 'Conversation ID' })
  conversationId: string;

  @ApiProperty({ description: 'Customer ID' })
  customerId: string;

  @ApiProperty({ description: 'Customer name' })
  customerName: string;

  @ApiProperty({ description: 'Customer WhatsApp number' })
  customerWhatsapp: string;

  @ApiProperty({ description: 'Last message content' })
  lastMessage: string;

  @ApiProperty({ description: 'Last message timestamp' })
  lastMessageAt: Date;

  @ApiProperty({ description: 'Last message sender type' })
  lastMessageFrom: string;

  @ApiProperty({ description: 'Conversation status' })
  status: string;

  @ApiProperty({ description: 'Total message count' })
  messageCount: number;
}

export class ConversationListResponseDto {
  @ApiProperty({ description: 'List of conversations', type: [ConversationListItemDto] })
  conversations: ConversationListItemDto[];

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of conversations' })
  total: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPreviousPage: boolean;
}
