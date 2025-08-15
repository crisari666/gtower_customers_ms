import { Injectable, Logger } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { WhatsappService } from './whatsapp.service';
import { Customer, CustomerDocument } from '../customers/entities/customer.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);

  constructor(
    private readonly conversationService: ConversationService,
    private readonly whatsappService: WhatsappService,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
  ) {}

  async processCustomerMessage(whatsappNumber: string, messageContent: string): Promise<void> {
    try {
      const conversation = await this.conversationService.findConversationByWhatsappNumber(whatsappNumber);
      if (!conversation) {
        this.logger.warn(`No conversation found for WhatsApp number: ${whatsappNumber}`);
        return;
      }

      // Analyze message content and generate appropriate response
      const response = await this.generateResponse(messageContent, conversation);
      
      if (response) {
        // Send automated response
        await this.whatsappService.sendTextMessage(
          whatsappNumber, 
          response, 
          (conversation as any).customerId.toString()
        );
        
        this.logger.log(`AI response sent to ${whatsappNumber}: ${response}`);
      }
    } catch (error) {
      this.logger.error('Error processing customer message with AI:', error);
    }
  }

  private async generateResponse(messageContent: string, conversation: any): Promise<string | null> {
    const lowerMessage = messageContent.toLowerCase();
    
    // Simple rule-based responses (can be enhanced with actual AI/ML)
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return 'Hello! Thank you for reaching out. How can I assist you today?';
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      return 'I\'m here to help! What specific assistance do you need?';
    }
    
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('quote')) {
      return 'I\'d be happy to help you with pricing information. Could you provide more details about what you\'re looking for?';
    }
    
    if (lowerMessage.includes('schedule') || lowerMessage.includes('appointment') || lowerMessage.includes('booking')) {
      return 'To schedule an appointment, please let me know your preferred date and time, and I\'ll check our availability.';
    }
    
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return 'You\'re welcome! Is there anything else I can help you with?';
    }
    
    if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
      return 'Thank you for chatting with us! Have a great day. If you need anything else, feel free to reach out.';
    }
    
    // Default response for unrecognized messages
    return 'Thank you for your message. I\'m processing your request and will get back to you shortly. If this is urgent, please contact our support team directly.';
  }

  async startAutomatedConversation(customerId: string, templateName: string): Promise<any> {
    try {
      const customer = await this.customerModel.findById(customerId).exec();
      if (!customer) {
        throw new Error('Customer not found');
      }

      if (!customer.whatsapp) {
        throw new Error('Customer does not have WhatsApp number');
      }

      // Start conversation with template
      const result = await this.whatsappService.startConversation({
        customerId,
        templateName,
        languageCode: 'en_US',
      });

      this.logger.log(`Automated conversation started with customer ${customerId} using template ${templateName}`);
      
      return result;
    } catch (error) {
      this.logger.error('Error starting automated conversation:', error);
      throw error;
    }
  }

  async sendFollowUpMessage(customerId: string, message: string): Promise<any> {
    try {
      const customer = await this.customerModel.findById(customerId).exec();
      if (!customer) {
        throw new Error('Customer not found');
      }

      if (!customer.whatsapp) {
        throw new Error('Customer does not have WhatsApp number');
      }

      // Send follow-up message
      const result = await this.whatsappService.sendTextMessage(
        customer.whatsapp,
        message,
        customerId
      );

      this.logger.log(`Follow-up message sent to customer ${customerId}`);
      
      return result;
    } catch (error) {
      this.logger.error('Error sending follow-up message:', error);
      throw error;
    }
  }

  async getConversationAnalytics(customerId: string): Promise<any> {
    try {
      const conversation = await this.conversationService.findConversationByCustomer(customerId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const messages = await this.conversationService.getConversationMessages((conversation as any)._id.toString());
      
      const analytics = {
        totalMessages: messages.length,
        customerMessages: messages.filter(m => m.senderType === 'customer').length,
        agentMessages: messages.filter(m => m.senderType === 'agent').length,
        lastMessageAt: conversation.lastMessageAt,
        conversationStatus: conversation.status,
        averageResponseTime: this.calculateAverageResponseTime(messages),
      };

      return analytics;
    } catch (error) {
      this.logger.error('Error getting conversation analytics:', error);
      throw error;
    }
  }

  private calculateAverageResponseTime(messages: any[]): number | null {
    const customerMessages = messages.filter(m => m.senderType === 'customer');
    const agentMessages = messages.filter(m => m.senderType === 'agent');
    
    if (customerMessages.length === 0 || agentMessages.length === 0) {
      return null;
    }

    let totalResponseTime = 0;
    let responseCount = 0;

    for (const customerMsg of customerMessages) {
      const nextAgentMsg = agentMessages.find(m => 
        new Date(m.createdAt) > new Date(customerMsg.createdAt)
      );
      
      if (nextAgentMsg) {
        const responseTime = new Date(nextAgentMsg.createdAt).getTime() - new Date(customerMsg.createdAt).getTime();
        totalResponseTime += responseTime;
        responseCount++;
      }
    }

    return responseCount > 0 ? totalResponseTime / responseCount : null;
  }
}
