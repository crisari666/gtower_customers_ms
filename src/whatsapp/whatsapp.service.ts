import { Injectable, Logger } from '@nestjs/common';
import { CreateWhatsappDto } from './dto/create-whatsapp.dto';
import { UpdateWhatsappDto } from './dto/update-whatsapp.dto';
import { StartConversationDto } from './dto/start-conversation.dto';
import { ConversationService } from './conversation.service';
import { Customer, CustomerDocument } from '../customers/entities/customer.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios, { AxiosResponse } from 'axios';

const accountProd = "746024655261570";

const pathMessage = `v23.0/${accountProd}/messages`

const urlBaseWsBusinessFb = "https://graph.facebook.com/";

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  readonly headers = {
    "Content-type": "application/json",
    "Authorization": `Bearer ${process.env.WHATSAPP_TOKEN}`,
  }

  constructor(
    private readonly conversationService: ConversationService,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
  ) {}

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

      // Send template message
      const response = await this.sendTemplateMessage(
        customer.whatsapp,
        startConversationDto.templateName,
        startConversationDto.languageCode || 'en_US'
      );

      // Create message record
      if (response.messages && response.messages[0]) {
        await this.conversationService.createMessage({
          conversationId: (conversation as any)._id.toString(),
          customerId: startConversationDto.customerId,
          whatsappNumber: customer.whatsapp,
          whatsappMessageId: response.messages[0].id,
          senderType: 'agent',
          messageType: 'template',
          content: `Template: ${startConversationDto.templateName}`,
          status: 'pending',
          isTemplate: true,
          templateName: startConversationDto.templateName,
          metadata: response,
        });
      }

      return { success: true, data: response, conversationId: (conversation as any)._id };
    } catch (error) {
      this.logger.error('Error starting conversation:', error);
      throw error;
    }
  }

  async sendTemplateMessage(to: string, templateName: string, languageCode: string = 'en_US'): Promise<any> {
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
        `${urlBaseWsBusinessFb}${pathMessage}`,
        data,
        { headers: this.headers }
      );
      
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
        `${urlBaseWsBusinessFb}${pathMessage}`,
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
        `${urlBaseWsBusinessFb}${pathMessage}`,
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
}
