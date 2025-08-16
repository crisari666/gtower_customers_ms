import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatsService } from './chats.service';
import { PaginationDto } from '../app/shared/pagination.dto';
import { ConversationMessagesResponseDto } from '../app/shared/conversation-messages-response.dto';

@ApiTags('chats')
@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}


  @Get('customer/:customerId/conversation')
  @ApiOperation({ summary: 'Get customer conversation messages with pagination' })
  @ApiResponse({ status: 200, description: 'Customer conversation messages retrieved successfully', type: ConversationMessagesResponseDto })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getCustomerConversation(
    @Param('customerId') customerId: string,
    @Query() paginationDto: PaginationDto
  ): Promise<ConversationMessagesResponseDto> {
    return this.chatsService.getCustomerConversation(customerId, paginationDto);
  }
}
