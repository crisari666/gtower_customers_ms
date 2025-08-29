import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { Conversation, ConversationSchema } from './entities/conversation.entity';
import { Message, MessageSchema } from './entities/message.entity';
import { Customer, CustomerSchema } from '../customers/entities/customer.entity';
import { ConversationService } from './conversation.service';
import { AiAgentService } from './ai-agent.service';
import { LangChainService } from './services/langchain.service';
import { LangChainConfig } from './config/langchain.config';
import { WebSocketModule } from '../websocket/websocket.module';
import { SentimentModule } from '../sentiment/sentiment.module';
import { CustomersService } from 'src/customers/customers.service';

@Module({
  imports: [
    ConfigModule,
    WebSocketModule,
    SentimentModule,
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Customer.name, schema: CustomerSchema },
    ]),
  ],
  controllers: [WhatsappController],
  providers: [
    WhatsappService, 
    ConversationService, 
    AiAgentService, 
    LangChainService,
    LangChainConfig,
    CustomersService
  ],
  exports: [WhatsappService, ConversationService, AiAgentService, LangChainService],
})
export class WhatsappModule {}
