import { Injectable, Logger } from '@nestjs/common';
import { StartConversationDto } from './dto/start-conversation.dto';
import { ConversationService } from './conversation.service';
import { Customer, CustomerDocument } from '../customers/entities/customer.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios, { AxiosResponse } from 'axios';
import { templates } from './config/templates';
import { WebSocketService } from '../websocket/websocket.service';


const urlBaseWsBusinessFb = "https://graph.facebook.com/";

@Injectable()
export class WhatsappService {
  private accountProd = process.env.WS_ACCOUNT_PROD;
  private accountTest = process.env.WS_ACCOUNT_TEST;
  
  private pathMessage = `v23.0/${process.env.IS_DEV === 'true' ? this.accountTest : this.accountProd}/messages`

  
  
  private readonly logger = new Logger(WhatsappService.name);
  readonly headers = {
    "Content-type": "application/json",
    "Authorization": `Bearer ${process.env.WHATSAPP_TOKEN}`,
  }
  
  constructor(
    private readonly conversationService: ConversationService,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    private readonly webSocketService: WebSocketService,
  ) {
    console.log({accountProd: this.accountProd, accountTest: this.accountTest, pathMessage: this.pathMessage});

  }

  async startConversation(startConversationDto: StartConversationDto): Promise<any> {
    try {
      const customer = await this.customerModel.findById(startConversationDto.customerId).exec();
      
      if (!customer) {
        throw new Error('Customer not found');
      }

      if (!customer.whatsapp) {
        throw new Error('Customer does not have WhatsApp number');
      }

      // Find or create conversation
      const conversation = await this.conversationService.findOrCreateConversation(
        startConversationDto.customerId,
        customer.whatsapp
      );

      

      // Send template message with customer name parameter
      const response = await this.msgTemplate({
        to: customer.whatsapp,
        messaging_product: "whatsapp",
        recipient_type: "individual",
        type: "template",
        template: {
          name: startConversationDto.templateName,
          language: {
            code: startConversationDto.languageCode || 'en_US',
          },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: customer.name,
                  parameter_name: 'customer_name',
                },
              ],
            },
          ],
        },
      });

      // Create message record
      if (response.messages && response.messages[0]) {
        // Get the actual template content with parameter substitution
        const actualContent = this.getTemplateContent(startConversationDto.templateName, {
          customer_name: customer.name
        });
        
        await this.conversationService.createMessage({
          conversationId: (conversation as any)._id.toString(),
          customerId: startConversationDto.customerId,
          whatsappNumber: customer.whatsapp,
          whatsappMessageId: response.messages[0].id,
          senderType: 'agent',
          messageType: 'template',
          content: actualContent,
          status: 'pending',
          isTemplate: true,
          templateName: startConversationDto.templateName,
          metadata: response,
        });

        // Notify connected WebSocket clients about the new conversation
        this.webSocketService.broadcastCustomEvent('whatsappConversationStarted', {
          conversationId: (conversation as any)._id.toString(),
          customerId: startConversationDto.customerId,
          customerName: customer.name,
          whatsappNumber: customer.whatsapp,
          templateName: startConversationDto.templateName,
          timestamp: new Date(),
        });
      }

      return { success: true, data: response, conversationId: (conversation as any)._id };
    } catch (error) {
      //this.logger.error('Error starting conversation:', error);
      throw error;
    }
  }

  async sendTemplateMessage(
    to: string, 
    templateName: string, 
    languageCode: string = 'en_US',
    options?: {
      customerId?: string;
      parameters?: Record<string, string>;
      createMessageRecord?: boolean;
    }
  ): Promise<any> {
    try {
      const data = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "template",
        "template": {
          "name": templateName,
          "language": { "code": languageCode }
        }
      };

      const responseMsg: AxiosResponse = await axios.post(
        `${urlBaseWsBusinessFb}${this.pathMessage}`,
        data,
        { headers: this.headers }
      );
      
      // Create message record if requested
      if (options?.createMessageRecord && options.customerId && responseMsg.data.messages && responseMsg.data.messages[0]) {
        const conversation = await this.conversationService.findConversationByWhatsappNumber(to);
        if (conversation) {
          const actualContent = this.getTemplateContent(templateName, options.parameters || {});
          
          await this.conversationService.createMessage({
            conversationId: (conversation as any)._id.toString(),
            customerId: options.customerId,
            whatsappNumber: to,
            whatsappMessageId: responseMsg.data.messages[0].id,
            senderType: 'agent',
            messageType: 'template',
            content: actualContent,
            status: 'pending',
            isTemplate: true,
            templateName: templateName,
            metadata: responseMsg.data,
          });
        }
      }
      
      return responseMsg.data;
    } catch (error) {
      this.logger.error('Error sending template message:', error);
      throw error;
    }
  }

  async sendTextMessage(to: string, message: string, customerId?: string): Promise<any> {
    try {
      const data = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {
          "body": message
        }
      };

      const responseMsg: AxiosResponse = await axios.post(
        `${urlBaseWsBusinessFb}${this.pathMessage}`,
        data,
        { headers: this.headers }
      );
      
      // If customerId is provided, create message record
      if (customerId && responseMsg.data.messages && responseMsg.data.messages[0]) {
        const conversation = await this.conversationService.findConversationByWhatsappNumber(to);
        if (conversation) {
          await this.conversationService.createMessage({
            conversationId: (conversation as any)._id.toString(),
            customerId,
            whatsappNumber: to,
            whatsappMessageId: responseMsg.data.messages[0].id,
            senderType: 'agent',
            messageType: 'text',
            content: message,
            status: 'pending',
            metadata: responseMsg.data,
          });
        }
      }
      
      return responseMsg.data;
    } catch (error) {
      this.logger.error('Error sending text message:', error);
      throw error;
    }
  }

  async sendHelloWorld(): Promise<any> {
    try {
      const responseMsg: AxiosResponse = await axios.post(
        `${urlBaseWsBusinessFb}${this.pathMessage}`,
        {
          "messaging_product": "whatsapp",
          "to": "573108834323",
          "type": "template",
          "template": {
            "name": "hello_world",
            "language": { "code": "en_US" }
          }
        },
        { headers: this.headers }
      );
      return responseMsg.data;
    } catch (error) {
      this.logger.error('Error on WsBusiness.sendTicketMsgText:', error);
      throw error;
    }
  }

  async clearConversation(conversationId: string): Promise<any> {
    try {
      const result = await this.conversationService.clearConversation(conversationId);
      this.logger.log(`Conversation ${conversationId} cleared successfully`);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error('Error clearing conversation:', error);
      throw error;
    }
  }

  async clearConversationByCustomerId(customerId: string): Promise<any> {
    try {
      const result = await this.conversationService.clearConversationByCustomerId(customerId);
      this.logger.log(`Conversation for customer ${customerId} cleared successfully`);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error('Error clearing conversation by customer ID:', error);
      throw error;
    }
  }

  /**
   * Helper method to get template content with parameter substitution
   */
  private getTemplateContent(templateName: string, parameters: Record<string, string> = {}): string {
    const templateContent = templates[templateName as keyof typeof templates];
    if (!templateContent) {
      return `Template: ${templateName}`;
    }
    
    let content = templateContent;
    // Replace template parameters with actual values
    Object.entries(parameters).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      content = content.replace(new RegExp(placeholder, 'g'), value);
    });
    
    return content;
  }

  /**
   * Get all available templates
   */
  getAvailableTemplates(): Record<string, string> {
    return templates;
  }

  /**
   * Get a specific template by name
   */
  getTemplate(templateName: string): string | null {
    return templates[templateName as keyof typeof templates] || null;
  }

  async msgTemplate(messageTemplate: any):Promise<any> {
    try {
      console.log({pathMessage: this.pathMessage});
      const responseMsg: AxiosResponse = await axios.post(
        `${urlBaseWsBusinessFb}${this.pathMessage}`,
        messageTemplate,
        {headers: this.headers}
        )
      return responseMsg.data;
    } catch (error) {
      console.error('Error on WsBusiness.sendTicketMsg');
      // console.error({error});
      //console.error({error:  JSON.stringify( (error as any).response.data)});
      throw error
     
    }
  }
}
