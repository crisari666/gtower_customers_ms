import { Injectable, Logger } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { WhatsappService } from './whatsapp.service';
import { LangChainService } from './services/langchain.service';
import { Customer, CustomerDocument } from '../customers/entities/customer.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppWebSocketGateway, CustomerProspectStatusEvent } from '../websocket/websocket.gateway';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);

  constructor(
    private readonly conversationService: ConversationService,
    private readonly whatsappService: WhatsappService,
    private readonly langChainService: LangChainService,
    private readonly webSocketGateway: AppWebSocketGateway,
    private readonly customersService: CustomersService,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
  ) {}

  async processCustomerMessage(whatsappNumber: string, messageContent: string): Promise<void> {
    try {
      const conversation = await this.conversationService.findConversationByWhatsappNumber(whatsappNumber);
      if (!conversation) {
        this.logger.warn(`No conversation found for WhatsApp number: ${whatsappNumber}`);
        return;
      }

      // Get conversation history for context
      const conversationHistory = await this.getConversationHistoryForAI((conversation as any)._id.toString());

      //console.log(JSON.stringify({conversationHistory}, null, 2));
      
      // Check if this is the first customer response (after the initial template)
      const messageCount = await this.conversationService.getMessageCountByConversation((conversation as any)._id.toString());
      const isFirstCustomerResponse = messageCount === 2; // Initial template + first customer message

      // Check if riviera_information_es template has already been sent in this conversation
      const hasRivieraTemplateBeenSent = await this.conversationService.hasTemplateBeenSentInConversation(
        (conversation as any)._id.toString(),
        'riviera_information_es'
      );

      // Analyze customer sentiment
      const sentiment = await this.langChainService.analyzeCustomerSentiment(
        messageContent,
        conversationHistory
      );

      // console.log(JSON.stringify({sentiment, messageContent, conversationHistory}, null, 2));
      
      // If this is the first customer response and riviera template hasn't been sent yet, send it
      if (isFirstCustomerResponse && !hasRivieraTemplateBeenSent) {
        try {
          await this.whatsappService.sendTemplateMessage(
            whatsappNumber,
            'riviera_information_contact_es',
            'es',
            {
              customerId: (conversation as any).customerId.toString(),
              createMessageRecord: true
            }
          );
          this.logger.log(`Riviera information template sent to ${whatsappNumber} after first customer response`);
          return;
        } catch (templateError) {
          this.logger.error('Error sending riviera information template:', templateError);
          // Continue with normal AI response if template fails
        }
      }

      // Generate intelligent response using LangChain with function calling
      const response = await this.langChainService.generateResponseWithFunctionCalling(
        messageContent,
        conversationHistory,
        this.buildCustomerContext(conversation, sentiment),
        'openai',
        (conversation as any).customerId.toString()
      );

      console.log(JSON.stringify({response}, null, 2));
      
      if (response) {
        // Check if the response contains a function call
        if (response.functionCall) {
          console.info('functionCall', response.functionCall, "conversation", (conversation as any));
          await this.executeFunctionCall(response.functionCall, (conversation as any).customerId.toString());
        }

        // Send automated response (only the customer-facing message)
        const whatsappResponse = await this.whatsappService.sendTextMessage(
          whatsappNumber, 
          typeof response === 'string' ? response : response.customerMessage, 
          (conversation as any).customerId.toString()
        );

        // After the message is sent and created in the database, emit WebSocket event
        if (whatsappResponse && whatsappResponse.messages && whatsappResponse.messages[0]) {
          try {
                         // Verify that the message was actually created in the database
             const createdMessage = await this.conversationService.findMessageByWhatsappId(whatsappResponse.messages[0].id);
             
             if (createdMessage) {
               const messageData = {
                 conversationId: (conversation as any)._id.toString(),
                 customerId: (conversation as any).customerId.toString(),
                 whatsappNumber,
                 whatsappMessageId: whatsappResponse.messages[0].id,
                 senderType: 'agent' as const,
                 messageType: 'text',
                 content: typeof response === 'string' ? response : response.customerMessage,
                 status: 'pending',
                 metadata: whatsappResponse,
                 isTemplate: false,
                 templateName: '',
                 timestamp: new Date(),
               };

               // Send WebSocket notification using the gateway's emitWhatsAppMessage method
               this.webSocketGateway.emitWhatsAppMessage(messageData);
               this.logger.log(`WebSocket notification sent for AI agent message via gateway`);
             } else {
               this.logger.warn(`Message was sent to WhatsApp but not found in database: ${whatsappResponse.messages[0].id}`);
             }
          } catch (websocketError) {
            this.logger.error('Error sending WebSocket notification for AI agent message:', websocketError);
            // Don't fail the entire operation if WebSocket fails
          }
        } else {
          this.logger.warn('WhatsApp response does not contain message ID, skipping WebSocket notification');
        }
        
        this.logger.log(`AI response sent to ${whatsappNumber}: ${response.customerMessage || response}`);
        this.logger.log(`Customer sentiment: ${sentiment.sentiment} (confidence: ${sentiment.confidence})`);
      }
    } catch (error) {
      this.logger.error('Error processing customer message with AI:', error);
    }
  }

  private async executeFunctionCall(functionCall: any, customerId: string): Promise<void> {
    try {
      if (functionCall.function === 'markCustomerAsProspect') {
        const { prospectSource, additionalNotes } = functionCall.parameters || {};
        
        await this.customersService.markAsProspect(
          customerId,
          prospectSource || 'whatsapp_ai_conversation',
          additionalNotes
        );
        
        this.logger.log(`Customer ${customerId} marked as prospect via function call`);
        
        // Emit WebSocket event for prospect status change
        try {
          this.webSocketGateway.emitCustomerProspectStatus({
            customerId,
            isProspect: true,
            prospectDate: new Date(),
            prospectSource: prospectSource || 'whatsapp_ai_conversation',
            additionalNotes,
            timestamp: new Date()
          });
        } catch (websocketError) {
          this.logger.error('Error emitting WebSocket event for prospect status:', websocketError);
        }
      }
    } catch (error) {
      this.logger.error('Error executing function call:', error);
    }
  }

  private async getConversationHistoryForAI(conversationId: string): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
    try {
      const messages = await this.conversationService.getConversationMessages(conversationId, 20, 0);
      
      return messages.map(msg => ({
        role: msg.senderType === 'customer' ? 'user' : 'assistant',
        content: msg.content
      }));
    } catch (error) {
      this.logger.error('Error getting conversation history for AI:', error);
      return [];
    }
  }

  private buildCustomerContext(conversation: any, sentiment: any): string {
    let context = `Customer conversation context:`;
    
    if (conversation.messageCount > 0) {
      context += `\n- Total messages: ${conversation.messageCount}`;
    }
    
    if (conversation.lastMessageFrom) {
      context += `\n- Last message from: ${conversation.lastMessageFrom}`;
    }
    
    if (sentiment) {
      context += `\n- Current sentiment: ${sentiment.sentiment} (confidence: ${sentiment.confidence})`;
      if (sentiment.reasoning) {
        context += `\n- Sentiment reasoning: ${sentiment.reasoning}`;
      }
    }
    
    return context;
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

  async sendIntelligentFollowUp(customerId: string): Promise<any> {
    try {
      const customer = await this.customerModel.findById(customerId).exec();
      if (!customer) {
        throw new Error('Customer not found');
      }

      if (!customer.whatsapp) {
        throw new Error('Customer does not have WhatsApp number');
      }

      const conversation = await this.conversationService.findConversationByCustomer(customerId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const conversationHistory = await this.getConversationHistoryForAI((conversation as any)._id.toString());
      
      // Generate intelligent follow-up suggestions
      const suggestions = await this.langChainService.generateFollowUpSuggestions(
        conversationHistory,
        `Customer: ${customer.name}, WhatsApp: ${customer.whatsapp}`
      );

      if (suggestions.length > 0) {
        const followUpMessage = suggestions[0]; // Use the first suggestion
        
        const result = await this.whatsappService.sendTextMessage(
          customer.whatsapp,
          followUpMessage,
          customerId
        );

        this.logger.log(`Intelligent follow-up sent to customer ${customerId}: ${followUpMessage}`);
        
        return { ...result, followUpMessage, allSuggestions: suggestions };
      }

      return { message: 'No follow-up suggestions generated' };
    } catch (error) {
      this.logger.error('Error sending intelligent follow-up:', error);
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
      
      // Get AI-generated conversation summary
      const conversationHistory = await this.getConversationHistoryForAI((conversation as any)._id.toString());
      const summary = await this.langChainService.generateConversationSummary(conversationHistory);
      
      const analytics = {
        totalMessages: messages.length,
        customerMessages: messages.filter(m => m.senderType === 'customer').length,
        agentMessages: messages.filter(m => m.senderType === 'agent').length,
        lastMessageAt: conversation.lastMessageAt,
        conversationStatus: conversation.status,
        averageResponseTime: this.calculateAverageResponseTime(messages),
        aiSummary: summary,
        modelStatus: this.langChainService.getModelStatus(),
      };

      return analytics;
    } catch (error) {
      this.logger.error('Error getting conversation analytics:', error);
      throw error;
    }
  }

  async getEnhancedConversationInsights(customerId: string): Promise<any> {
    try {
      const conversation = await this.conversationService.findConversationByCustomer(customerId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const messages = await this.conversationService.getConversationMessages((conversation as any)._id.toString());
      const conversationHistory = await this.getConversationHistoryForAI((conversation as any)._id.toString());
      
      // Analyze overall conversation sentiment
      const recentMessages = messages
        .filter(m => m.senderType === 'customer')
        .slice(-5)
        .map(m => m.content);
      
      let overallSentiment = { sentiment: 'neutral', confidence: 0.5, reasoning: 'No recent messages' };
      
      if (recentMessages.length > 0) {
        const lastMessage = recentMessages[recentMessages.length - 1];
        overallSentiment = await this.langChainService.analyzeCustomerSentiment(
          lastMessage,
          conversationHistory
        );
      }

      // Generate follow-up suggestions
      const followUpSuggestions = await this.langChainService.generateFollowUpSuggestions(
        conversationHistory,
        `Customer ID: ${customerId}`
      );

      const insights = {
        conversationId: (conversation as any)._id,
        customerId,
        messageCount: messages.length,
        conversationDuration: this.calculateConversationDuration(conversation),
        overallSentiment,
        followUpSuggestions,
        aiModelStatus: this.langChainService.getModelStatus(),
        conversationSummary: await this.langChainService.generateConversationSummary(conversationHistory),
      };

      return insights;
    } catch (error) {
      this.logger.error('Error getting enhanced conversation insights:', error);
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

  private calculateConversationDuration(conversation: any): string {
    if (!conversation.createdAt || !conversation.lastMessageAt) {
      return 'Unknown';
    }

    const start = new Date(conversation.createdAt);
    const end = new Date(conversation.lastMessageAt);
    const durationMs = end.getTime() - start.getTime();
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  async getModelStatus(): Promise<any> {
    return this.langChainService.getModelStatus();
  }
}
