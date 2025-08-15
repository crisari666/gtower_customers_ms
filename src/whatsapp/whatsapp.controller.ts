import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, Logger, Headers, Query } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { ConversationService } from './conversation.service';
import { SendMessageDto } from './dto/send-message.dto';
import { StartConversationDto } from './dto/start-conversation.dto';
import { WebhookDto } from './dto/webhook.dto';

@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);
  
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly conversationService: ConversationService,
  ) {}


  @Get('webhook')
  @HttpCode(HttpStatus.OK)
  webhook(@Body() data: any, @Headers() headers: any, @Query() query: any) {
    this.logger.log('Webhook verification received:');
    this.logger.log(JSON.stringify(query, null, 2));
    const challenge = query['hub.challenge'];
    return challenge;
  }
  
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhookPost(@Body() webhookData: WebhookDto) {
    this.logger.log('Webhook data received:');
    this.logger.log(JSON.stringify(webhookData, null, 2));
    
    try {
      await this.processWebhookData(webhookData);
      return { success: true };
    } catch (error) {
      this.logger.error('Error processing webhook:', error);
      return { success: false, error: error.message };
    }
  }

  private async processWebhookData(webhookData: WebhookDto): Promise<void> {
    if (webhookData.object !== 'whatsapp_business_account') {
      return;
    }

    for (const entry of webhookData.entry) {
      for (const change of entry.changes) {
        if (change.field === 'messages') {
          await this.processMessageChanges(change.value);
        }
      }
    }
  }

  private async processMessageChanges(value: any): Promise<void> {
    // Process incoming messages from customers
    if (value.messages && value.messages.length > 0) {
      for (const message of value.messages) {
        if (message.from) { // Customer message
          await this.processCustomerMessage(message, value.metadata);
        }
      }
    }

    // Process message status updates
    if (value.statuses && value.statuses.length > 0) {
      for (const status of value.statuses) {
        await this.processMessageStatus(status);
      }
    }
  }

  private async processCustomerMessage(message: any, metadata: any): Promise<void> {
    try {
      const whatsappNumber = message.from;
      const conversation = await this.conversationService.findConversationByWhatsappNumber(whatsappNumber);
      
      if (!conversation) {
        this.logger.warn(`No conversation found for WhatsApp number: ${whatsappNumber}`);
        return;
      }

      // Create message record
      await this.conversationService.createMessage({
        conversationId: (conversation as any)._id.toString(),
        customerId: (conversation as any).customerId.toString(),
        whatsappNumber,
        whatsappMessageId: message.id,
        senderType: 'customer',
        messageType: message.type || 'text',
        content: message.text?.body || 'Unknown message type',
        status: 'delivered',
        metadata: { message, metadata },
      });

      this.logger.log(`Customer message processed: ${message.id}`);
    } catch (error) {
      this.logger.error('Error processing customer message:', error);
    }
  }

  private async processMessageStatus(status: any): Promise<void> {
    try {
      const message = await this.conversationService.findMessageByWhatsappId(status.id);
      if (!message) {
        this.logger.warn(`Message not found for status update: ${status.id}`);
        return;
      }

      const updateData: any = { status: status.status };
      
      if (status.status === 'sent') {
        updateData.sentAt = new Date(parseInt(status.timestamp) * 1000);
      } else if (status.status === 'delivered') {
        updateData.deliveredAt = new Date(parseInt(status.timestamp) * 1000);
      } else if (status.status === 'read') {
        updateData.readAt = new Date(parseInt(status.timestamp) * 1000);
      }

      await this.conversationService.updateMessageStatus(status.id, updateData);
      this.logger.log(`Message status updated: ${status.id} -> ${status.status}`);
    } catch (error) {
      this.logger.error('Error processing message status:', error);
    }
  }

  @Post('send-message')
  @HttpCode(HttpStatus.OK)
  async sendMessage(@Body() sendMessageDto: SendMessageDto) {
    this.logger.log(`Sending WhatsApp message to: ${sendMessageDto.to}`);
    try {
      const result = await this.whatsappService.sendTextMessage(sendMessageDto.to, sendMessageDto.message);
      this.logger.log('Message sent successfully');
      return { success: true, data: result };
    } catch (error) {
      this.logger.error('Failed to send WhatsApp message', error);
      throw error;
    }
  }

  @Post('start-conversation')
  @HttpCode(HttpStatus.OK)
  async startConversation(@Body() startConversationDto: StartConversationDto) {
    this.logger.log(`Starting conversation with customer: ${startConversationDto.customerId}`);
    try {
      const result = await this.whatsappService.startConversation(startConversationDto);
      this.logger.log('Conversation started successfully');
      return result;
    } catch (error) {
      this.logger.error('Failed to start conversation', error);
      throw error;
    }
  }

  @Post('send-hello-world')
  @HttpCode(HttpStatus.OK)
  async sendHelloWorld() {
    try {
      const result = await this.whatsappService.sendHelloWorld();
      this.logger.log('Hello world template sent successfully');
      return { success: true, data: result };
    } catch (error) {
      this.logger.error('Failed to send WhatsApp hello world template', error);
      throw error;
    }
  }

  @Get('conversation/:customerId')
  async getConversationHistory(@Param('customerId') customerId: string) {
    try {
      const result = await this.conversationService.getConversationHistory(customerId);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error('Failed to get conversation history', error);
      throw error;
    }
  }
}
