import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/config.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomersModule } from './customers/customers.module';
import { CallLogsModule } from './call_logs/call_logs.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { ChatsModule } from './chats/chats.module';
import { WebSocketModule } from './websocket/websocket.module';
import { SentimentModule } from './sentiment/sentiment.module';
import { ProspectModule } from './prospect/prospect.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true, envFilePath: '.env'}),
    AppConfigModule,
    MongooseModule.forRoot(
      `mongodb://${process.env.DATABASE_USER}:${process.env.DATABASE_PASS}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`,
    ),
    CustomersModule,
    CallLogsModule,
    WhatsappModule,
    ChatsModule,
    WebSocketModule,
    SentimentModule,
    ProspectModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
