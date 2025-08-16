import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConversationService } from '../whatsapp/conversation.service';
import { Customer, CustomerDocument } from '../customers/entities/customer.entity';
import { Message, MessageDocument } from '../whatsapp/entities/message.entity';
import { Conversation, ConversationDocument } from '../whatsapp/entities/conversation.entity';
import { PaginationDto } from '../app/shared/pagination.dto';
import { ConversationMessagesResponseDto } from '../app/shared/conversation-messages-response.dto';

@Injectable()
export class ChatsService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    private readonly conversationService: ConversationService,
  ) {}

  async getCustomerConversation(customerId: string, paginationDto: PaginationDto): Promise<ConversationMessagesResponseDto> {
    // Verify customer exists
    const customer = await this.customerModel.findById(customerId).exec();
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }
    
    
    // Get conversation for this customer
    const conversation = await this.conversationModel.findOne({ 
      customerId: customerId,
      status: 'active'
    }).exec();
    
    if (!conversation) {
      throw new NotFoundException('No conversation found for this customer');
    }

    // Get total message count for pagination
    const total = await this.messageModel.countDocuments({ 
      conversationId: conversation._id.toString()
    }).exec();


    
    // Get messages with pagination directly from database
    const messages = await this.messageModel
      .find({ conversationId: conversation._id.toString() })
      .sort({ createdAt: -1 })
      .limit(paginationDto.limit)
      .skip(paginationDto.skip)
      .select('content createdAt status messageType senderType')
      .exec();

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / paginationDto.limit);
    const hasNextPage = paginationDto.page < totalPages;
    const hasPreviousPage = paginationDto.page > 1;

    return {
      messages: messages,
      page: paginationDto.page,
      limit: paginationDto.limit,
      total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    };
  }
}
