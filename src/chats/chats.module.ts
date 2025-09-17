import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { ConversationService } from '../whatsapp/conversation.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { Conversation, ConversationSchema } from '../whatsapp/entities/conversation.entity';
import { Message, MessageSchema } from '../whatsapp/entities/message.entity';
import { Customer, CustomerSchema } from '../customers/entities/customer.entity';
import { WebSocketService } from 'src/websocket/websocket.service';
import { AppWebSocketGateway } from 'src/websocket/websocket.gateway';
import { CustomersService } from '../customers/customers.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Customer.name, schema: CustomerSchema },
    ]),
  ],
  controllers: [ChatsController],
  providers: [ChatsService, ConversationService, WhatsappService, WebSocketService, AppWebSocketGateway, CustomersService],
})
export class ChatsModule {}
