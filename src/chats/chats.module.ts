import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { ConversationService } from '../whatsapp/conversation.service';
import { Conversation, ConversationSchema } from '../whatsapp/entities/conversation.entity';
import { Message, MessageSchema } from '../whatsapp/entities/message.entity';
import { Customer, CustomerSchema } from '../customers/entities/customer.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Customer.name, schema: CustomerSchema },
    ]),
  ],
  controllers: [ChatsController],
  providers: [ChatsService, ConversationService],
})
export class ChatsModule {}
