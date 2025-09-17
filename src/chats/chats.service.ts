import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConversationService } from '../whatsapp/conversation.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { Customer, CustomerDocument } from '../customers/entities/customer.entity';
import { Message, MessageDocument } from '../whatsapp/entities/message.entity';
import { Conversation, ConversationDocument } from '../whatsapp/entities/conversation.entity';
import { PaginationDto } from '../app/shared/pagination.dto';
import { ConversationMessagesResponseDto } from '../app/shared/conversation-messages-response.dto';
import { ConversationListResponseDto } from '../app/shared/conversation-list-response.dto';
import { StartConversationDto } from '../whatsapp/dto/start-conversation.dto';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class ChatsService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    private readonly conversationService: ConversationService,
    private readonly whatsappService: WhatsappService,
    private readonly customersService: CustomersService,
  ) {}

  async startConversation(startConversationDto: StartConversationDto): Promise<any> {
    try {
      const result = await this.whatsappService.startConversation(startConversationDto);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async getCustomerConversation(customerId: string, paginationDto: PaginationDto): Promise<ConversationMessagesResponseDto> {
    // Verify customer exists
    const customer = await this.customerModel.findById(customerId).exec();
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }
    
    // Get conversation for this customer (including archived ones to find the last clear date)
    const conversation = await this.conversationModel.find({ 
      customerId: customerId
    }).sort({ createdAt: -1 }).exec();
    
    if (!conversation) {
      throw new NotFoundException('No conversation found for this customer');
    }

    // If conversation has a clear date, filter messages after that date
    // Otherwise, return all messages
    const messageFilter: any = { conversationId: conversation[0]._id.toString() };
    if (conversation[0].clearedAt) {
      messageFilter.createdAt = { $gt: conversation[0].clearedAt };
    }

    // Get total message count for pagination
    const total = await this.messageModel.countDocuments(messageFilter).exec();

    // Get messages with pagination directly from database
    const messages = await this.messageModel
      .find(messageFilter)
      .sort({ createdAt: 1 } as any)
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

  async getLastConversations(paginationDto: PaginationDto): Promise<ConversationListResponseDto> {
    // Get total conversation count for pagination
    const total = await this.conversationModel.countDocuments({ status: 'active' }).exec();

    // Use aggregation pipeline for better performance
    const conversations = await this.conversationModel.aggregate([
      // Match active conversations
      { $match: { status: 'active' } },
      
      // Lookup customer information
      {
        $lookup: {
          from: 'customers',
          let: { customerId: '$customerId' },
          pipeline: [
            { $match: { $expr: { $eq: [{$toObjectId: '$$customerId'}, "$_id"] } } },
            { $project: { name: 1, whatsapp: 1 } }
          ],
          as: 'customer'
        }
      },
      
      // Lookup last message
      {
        $lookup: {
          from: 'messages',
          let: { chatId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: [ '$$chatId', {$toObjectId: '$conversationId'}] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            { $project: { content: 1, createdAt: 1 } }
          ],
          as: 'lastMessage'
        }
      },
      
      // Unwind arrays
      { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$lastMessage', preserveNullAndEmptyArrays: true } },
      
      // Sort by last message timestamp
      { $sort: { lastMessageAt: -1 } },
      
      // Pagination
      { $skip: paginationDto.skip },
      { $limit: paginationDto.limit },
      
      // Project final structure
      {
        $project: {
          conversationId: '$_id',
          customerId: '$customerId',
          customerName: { $ifNull: ['$customer.name', 'Unknown'] },
          customerWhatsapp: '$whatsappNumber',
          lastMessage: { $ifNull: ['$lastMessage.content', 'No messages'] },
          lastMessageAt: { $ifNull: ['$lastMessage.createdAt', '$lastMessageAt', new Date()] },
          lastMessageFrom: '$lastMessageFrom',
          status: '$status',
          messageCount: '$messageCount'
        }
      }
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / paginationDto.limit);
    const hasNextPage = paginationDto.page < totalPages;
    const hasPreviousPage = paginationDto.page > 1;

    return {
      conversations,
      page: paginationDto.page,
      limit: paginationDto.limit,
      total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    };
  }

  async deleteConversation(conversationId: string): Promise<void> {
    // Verify conversation exists
    const conversation = await this.conversationModel.findById(conversationId).exec();
    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${conversationId} not found`);
    }

    // Delete all messages related to this conversation
    await this.messageModel.deleteMany({ conversationId: conversationId }).exec();

    // Delete the conversation
    await this.conversationModel.findByIdAndDelete(conversationId).exec();
  }
}
