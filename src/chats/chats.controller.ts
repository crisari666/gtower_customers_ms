import { Controller, Get, Param, Query, Delete, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatsService } from './chats.service';
import { PaginationDto } from '../app/shared/pagination.dto';
import { ConversationMessagesResponseDto } from '../app/shared/conversation-messages-response.dto';
import { ConversationListResponseDto } from '../app/shared/conversation-list-response.dto';
import { StartConversationDto } from '../whatsapp/dto/start-conversation.dto';

@ApiTags('chats')
@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post('start-conversation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start a new conversation with a customer using WhatsApp template' })
  @ApiResponse({ status: 200, description: 'Conversation started successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid customer or template data' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async startConversation(@Body() startConversationDto: StartConversationDto) {
    console.info(`Starting conversation with customer: ${startConversationDto.customerId}`);
    try {
      const result = await this.chatsService.startConversation(startConversationDto);
      return result;
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get last conversations with pagination' })
  @ApiResponse({ status: 200, description: 'Conversations retrieved successfully', type: ConversationListResponseDto })
  async getLastConversations(
    @Query() paginationDto: PaginationDto
  ): Promise<ConversationListResponseDto> {
    return this.chatsService.getLastConversations(paginationDto);
  }

  @Get('customer/:customerId/conversation')
  @ApiOperation({ summary: 'Get customer conversation messages with pagination. Automatically filters messages after the last clear operation if conversation was cleared.' })
  @ApiResponse({ status: 200, description: 'Customer conversation messages retrieved successfully', type: ConversationMessagesResponseDto })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getCustomerConversation(
    @Param('customerId') customerId: string,
    @Query() paginationDto: PaginationDto
  ): Promise<ConversationMessagesResponseDto> {
    return this.chatsService.getCustomerConversation(customerId, paginationDto);
  }

  @Delete(':conversationId')
  @ApiOperation({ summary: 'Delete a conversation and all its related messages' })
  @ApiResponse({ status: 200, description: 'Conversation and messages deleted successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async deleteConversation(
    @Param('conversationId') conversationId: string
  ): Promise<{ message: string }> {
    await this.chatsService.deleteConversation(conversationId);
    return { message: 'Conversation and all related messages deleted successfully' };
  }
}
