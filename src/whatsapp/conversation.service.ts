import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from './entities/conversation.entity';
import { Message, MessageDocument } from './entities/message.entity';
import { Customer, CustomerDocument } from '../customers/entities/customer.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
  ) {}

  async createConversation(createConversationDto: CreateConversationDto): Promise<Conversation> {
    const conversation = new this.conversationModel(createConversationDto);
    return await conversation.save();
  }

  async findConversationByCustomer(customerId: string): Promise<Conversation | null> {
    return await this.conversationModel.findOne({ 
      customerId: customerId,
      status: 'active'
    }).exec();
  }

  async findConversationByWhatsappNumber(whatsappNumber: string): Promise<Conversation | null> {
    return await this.conversationModel.findOne({ 
      whatsappNumber,
      status: 'active'
    }).exec();
  }

  async updateConversationStatus(conversationId: string, status: string): Promise<Conversation> {
    const conversation = await this.conversationModel.findByIdAndUpdate(
      conversationId,
      { status },
      { new: true }
    ).exec();
    
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    
    return conversation;
  }

  async createMessage(createMessageDto: CreateMessageDto): Promise<Message> {
    const message = new this.messageModel(createMessageDto);
    const savedMessage = await message.save();

    //console.log({savedMessage});

    // Update conversation with last message info
    await this.conversationModel.findByIdAndUpdate(
      createMessageDto.conversationId,
      {
        lastMessageAt: new Date(),
        $inc: { 
          messageCount: 1,
        },
        lastMessageFrom: createMessageDto.senderType,
      }
    ).exec();
    
    return savedMessage;
  }

  async findMessageByWhatsappId(whatsappMessageId: string): Promise<Message | null> {
    return await this.messageModel.findOne({ whatsappMessageId }).exec();
  }

  async updateMessageStatus(whatsappMessageId: string, updateMessageDto: UpdateMessageDto): Promise<Message> {
    const updateData: any = { ...updateMessageDto };
    
    if (updateMessageDto.status === 'sent' && updateMessageDto.sentAt) {
      updateData.sentAt = new Date(updateMessageDto.sentAt);
    }
    if (updateMessageDto.status === 'delivered' && updateMessageDto.deliveredAt) {
      updateData.deliveredAt = new Date(updateMessageDto.deliveredAt);
    }
    if (updateMessageDto.status === 'read' && updateMessageDto.readAt) {
      updateData.readAt = new Date(updateMessageDto.readAt);
    }

    const message = await this.messageModel.findOneAndUpdate(
      { whatsappMessageId },
      updateData,
      { new: true }
    ).exec();
    
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    
    return message;
  }

  async getConversationMessages(conversationId: string, limit = 50, skip = 0): Promise<Message[]> {
    return await this.messageModel
      .find({ conversationId: conversationId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .exec();
  }

  async getConversationHistory(customerId: string): Promise<{ conversation: Conversation; messages: Message[] }> {
    const conversation = await this.findConversationByCustomer(customerId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found for this customer');
    }
    
    // Ensure the conversation is active
    if (conversation.status !== 'active') {
      throw new NotFoundException('Conversation is not active');
    }
    
    const messages = await this.getConversationMessages((conversation as any)._id.toString());
    
    return { conversation, messages };
  }

  async findOrCreateConversation(customerId: string, whatsappNumber: string): Promise<Conversation> {
    let conversation = await this.findConversationByCustomer(customerId);

    console.log({conversation});
    
    // Only consider active conversations
    if (conversation && conversation.status !== 'active') {
      conversation = null;
    }
    
    if (!conversation) {
      conversation = await this.createConversation({
        customerId,
        whatsappNumber,
        status: 'active',
      });
    }
    
    return conversation;
  }

  async clearConversation(conversationId: string): Promise<Conversation> {
    const conversation = await this.conversationModel.findByIdAndUpdate(
      conversationId,
      { 
        status: 'archived',
        lastMessageAt: new Date()
      },
      { new: true }
    ).exec();
    
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    
    this.logger.log(`Conversation ${conversationId} cleared and archived`);
    return conversation;
  }

  async clearConversationByCustomerId(customerId: string): Promise<Conversation> {
    const conversation = await this.conversationModel.findOneAndUpdate(
      { customerId: customerId },
      { 
        status: 'archived',
        lastMessageAt: new Date(),
        clearedAt: new Date()
      },
      { new: true }
    ).exec();
    
    if (!conversation) {
      throw new NotFoundException('Conversation not found for this customer');
    }
    
    this.logger.log(`Conversation for customer ${customerId} cleared and archived`);
    return conversation;
  }

  async findAllConversations(
    limit = 50,
    skip = 0,
    status?: string,
    customerId?: string
  ): Promise<{ conversations: Conversation[]; total: number }> {
    const filter: any = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (customerId) {
      filter.customerId = new Types.ObjectId(customerId);
    }
    
    const [conversations, total] = await Promise.all([
      this.conversationModel
        .find(filter)
        .sort({ lastMessageAt: -1, createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .exec(),
      this.conversationModel.countDocuments(filter).exec()
    ]);
    
    return { conversations, total };
  }

  async getLast50Messages(): Promise<Message[]> {
    return await this.messageModel
      .find()
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }

  async getMessageCountByConversation(conversationId: string): Promise<number> {
    return await this.messageModel
      .countDocuments({ conversationId })
      .exec();
  }
}
