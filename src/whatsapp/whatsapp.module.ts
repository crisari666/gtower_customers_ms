import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';

import { Conversation, ConversationSchema } from './entities/conversation.entity';
import { Message, MessageSchema } from './entities/message.entity';
import { Customer, CustomerSchema } from '../customers/entities/customer.entity';
import { ConversationService } from './conversation.service';
import { AiAgentService } from './ai-agent.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Customer.name, schema: CustomerSchema },
    ]),
  ],
  controllers: [WhatsappController],
  providers: [WhatsappService, ConversationService, AiAgentService],
  exports: [WhatsappService, ConversationService, AiAgentService],
})
export class WhatsappModule {}
