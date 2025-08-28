import { 
  Controller, 
  Get,
  Post, 
  Body, 
  Param,
  HttpCode, 
  HttpStatus, 
  ValidationPipe,
  Logger,
  Headers,
  Query
} from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { SendMessageDto } from './dto/send-message.dto';
import { StartConversationDto } from './dto/start-conversation.dto';
import { StartConversationCartagenaDto } from './dto/start_conversation.dto';
import { WebhookDto } from './dto/webhook.dto';
import { ConversationService } from './conversation.service';
import { AiAgentService } from './ai-agent.service';
import { AppWebSocketGateway, WhatsAppWebhookEvent } from '../websocket/websocket.gateway';
import { WebSocketService } from '../websocket/websocket.service';

@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);
  
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly conversationService: ConversationService,
    private readonly aiAgentService: AiAgentService,
    private readonly webSocketGateway: AppWebSocketGateway,
    private readonly webSocketService: WebSocketService,
  ) {}

  @Get('webhook')
  @HttpCode(HttpStatus.OK)
  webhook(@Body() data: any, @Headers() headers: any, @Query() query: any) {
    this.logger.log('Webhook verification received:');
    this.logger.log(JSON.stringify(query, null, 2));
    const challenge = query['hub.challenge'];
    
    // Broadcast webhook verification event to all connected clients
    const webhookEvent: WhatsAppWebhookEvent = {
      type: 'verification',
      challenge: challenge,
      data: query,
      timestamp: new Date(),
    };
    
    this.webSocketGateway.emitWebhookEvent(webhookEvent);
    
    return challenge;
  }
  
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhookPost(@Body() webhookData: any,) {
    try {
      await this.processWebhookData(webhookData);
      
      return { success: true };
    } catch (error) {
      this.logger.error('Error processing webhook:', error);
      return { success: false, error: error.message };
    }
  }

  private async processWebhookData(webhookData: WebhookDto): Promise<void> {
    //console.log(JSON.stringify(webhookData, null, 2));
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

    console.log(JSON.stringify(value, null, 2));
    if (value.messages && value.messages.length > 0) {
      for (const message of value.messages) {
        if (message.from) { // Customer message
          // Extract customer data from contacts
          const customerData = this.extractCustomerData(message.from, value.contacts);
          await this.processCustomerMessage(message, value.metadata, customerData);
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

  private extractCustomerData(whatsappNumber: string, contacts: any[]): any {
    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return null;
    }
    
    const contact = contacts.find(c => c.wa_id === whatsappNumber);
    return contact || null;
  }

  private async processCustomerMessage(message: any, metadata: any, customerData: any): Promise<void> {
    try {
      const whatsappNumber = message.from;
      const conversation = await this.conversationService.findConversationByWhatsappNumber(whatsappNumber);
      
      if (!conversation) {
        this.logger.warn(`No conversation found for WhatsApp number: ${whatsappNumber}`);
        return;
      }

      // Extract message content based on message type
      let messageContent = '';
      let messageType = message.type || 'text';
      
      if (message.type === 'button' && message.button?.payload) {
        messageContent = message.button.payload;
        messageType = 'button';
      } else if (message.text?.body) {
        messageContent = message.text.body;
      } else {
        messageContent = 'Unknown message type';
      }

      // Create message record
      await this.conversationService.createMessage({
        conversationId: (conversation as any)._id.toString(),
        customerId: (conversation as any).customerId.toString(),
        whatsappNumber,
        whatsappMessageId: message.id,
        senderType: 'customer',
        messageType,
        content: messageContent,
        status: 'delivered',
        metadata: { message, metadata, customerData },
      });

      // Log customer information if available
      if (customerData?.profile?.name) {
        this.logger.log(`Message from customer: ${customerData.profile.name} (${whatsappNumber})`);
      }

      // Emit WebSocket event for real-time updates with message entity structure
      const whatsappMessageEvent = {
        conversationId: (conversation as any)._id.toString(),
        customerId: (conversation as any).customerId.toString(),
        whatsappNumber,
        whatsappMessageId: message.id,
        senderType: 'customer' as const,
        messageType,
        content: messageContent,
        status: 'delivered',
        metadata: { message, metadata, customerData },
        isTemplate: false,
        templateName: '',
        timestamp: new Date(),
      };

      this.webSocketGateway.emitWhatsAppMessage(whatsappMessageEvent);

      // Process message with AI agent if there's content
      if (messageContent && messageContent !== 'Unknown message type') {
        await this.aiAgentService.processCustomerMessage(whatsappNumber, messageContent);
      }

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
      
      // Emit WebSocket event for status updates
      if (message.customerId) {
        this.webSocketGateway.emitWhatsAppMessageStatus(
          status.id,
          status.status,
          message.customerId.toString()
        );
      }
      
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
    console.info(`Starting conversation with customer: ${startConversationDto.customerId}`);
    try {
      const result = await this.whatsappService.startConversation(startConversationDto);
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

  @Post('ai/intelligent-follow-up/:customerId')
  @HttpCode(HttpStatus.OK)
  async sendIntelligentFollowUp(@Param('customerId') customerId: string) {
    this.logger.log(`Sending intelligent follow-up to customer: ${customerId}`);
    try {
      const result = await this.aiAgentService.sendIntelligentFollowUp(customerId);
      this.logger.log('Intelligent follow-up sent successfully');
      return { success: true, data: result };
    } catch (error) {
      this.logger.error('Failed to send intelligent follow-up', error);
      throw error;
    }
  }

  @Get('ai/analytics/:customerId')
  async getEnhancedAnalytics(@Param('customerId') customerId: string) {
    try {
      const result = await this.aiAgentService.getEnhancedConversationInsights(customerId);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error('Failed to get enhanced analytics', error);
      throw error;
    }
  }

  @Get('ai/model-status')
  async getModelStatus() {
    try {
      const result = await this.aiAgentService.getModelStatus();
      return { success: true, data: result };
    } catch (error) {
      this.logger.error('Failed to get model status', error);
      throw error;
    }
  }

  @Post('ai/process-message')
  @HttpCode(HttpStatus.OK)
  async processMessageWithAI(@Body() body: { whatsappNumber: string; message: string }) {
    this.logger.log(`Processing message with AI for: ${body.whatsappNumber}`);
    try {
      await this.aiAgentService.processCustomerMessage(body.whatsappNumber, body.message);
      return { success: true, message: 'Message processed with AI' };
    } catch (error) {
      this.logger.error('Failed to process message with AI', error);
      throw error;
    }
  }

  @Get('conversations')
  async getConversations() {
    try {
      const result = await this.conversationService.findAllConversations();
      return { success: true, data: result };
    } catch (error) {
      this.logger.error('Failed to get conversations', error);
      throw error;
    }
  }

  @Get('messages/last-50')
  async getLast50Messages() {
    try {
      const result = await this.conversationService.getLast50Messages();
      return { success: true, data: result };
    } catch (error) {
      this.logger.error('Failed to get last 50 messages', error);
      throw error;
    }
  }

  @Get('messages/chat-list/:customerId')
  async getChatMessages(@Param('customerId') customerId: string) {
    try {
      const result = await this.conversationService.getConversationHistory(customerId);
      
      // Transform messages to match the message entity structure
      const formattedMessages = result.messages.map(message => ({
        conversationId: message.conversationId.toString(),
        customerId: message.customerId.toString(),
        whatsappNumber: message.whatsappNumber,
        whatsappMessageId: message.whatsappMessageId,
        senderType: message.senderType,
        messageType: message.messageType,
        content: message.content,
        status: message.status,
        sentAt: message.sentAt,
        deliveredAt: message.deliveredAt,
        readAt: message.readAt,
        metadata: message.metadata,
        isTemplate: message.isTemplate,
        templateName: message.templateName || '',
        timestamp: new Date()
      }));
      
      return { success: true, data: formattedMessages };
    } catch (error) {
      this.logger.error('Failed to get chat messages', error);
      throw error;
    }
  }

  @Post('conversation/:conversationId/clear')
  @HttpCode(HttpStatus.OK)
  async clearConversation(@Param('conversationId') conversationId: string) {
    this.logger.log(`Clearing conversation: ${conversationId}`);
    try {
      const result = await this.whatsappService.clearConversation(conversationId);
      this.logger.log('Conversation cleared successfully');
      return { success: true, data: result };
    } catch (error) {
      this.logger.error('Failed to clear conversation', error);
      throw error;
    }
  }

  @Post('conversation/customer/:customerId/clear')
  @HttpCode(HttpStatus.OK)
  async clearConversationByCustomerId(@Param('customerId') customerId: string) {
    this.logger.log(`Clearing conversation for customer: ${customerId}`);
    try {
      const result = await this.whatsappService.clearConversationByCustomerId(customerId);
      this.logger.log('Conversation cleared successfully');
      return { success: true, data: result };
    } catch (error) {
      this.logger.error('Failed to clear conversation by customer ID', error);
      throw error;
    }
  }

  @Post('send-template/cartagena')
  async sendTemplateOneDayBefore(@Body(new ValidationPipe()) msgTemplateWsDto: StartConversationCartagenaDto) {
    try {
      // For now, use a hardcoded number since this is a specific use case
      // In the future, you can implement customer lookup if needed
      const response = await this.whatsappService.msgTemplate({
        to: '573108834323',
        messaging_product: "whatsapp",
        recipient_type: "individual",
        type: "template",
        template: {
          name: 'start_conversation_es',
          language: {
            code: 'es',
          },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: msgTemplateWsDto.customerName,
                  parameter_name: 'customer_name',
                },
              ],
            },
          ],
        },
      });
      
      return response;

    } catch (error) {
      this.logger.error('Failed to send template', error);
      throw error;
    }
  }
}
