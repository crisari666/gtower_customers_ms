import { Module } from '@nestjs/common';
import { AppWebSocketGateway } from './websocket.gateway';
import { WebSocketService } from './websocket.service';
import { WebSocketController } from './websocket.controller';

@Module({
  controllers: [WebSocketController],
  providers: [AppWebSocketGateway, WebSocketService],
  exports: [AppWebSocketGateway, WebSocketService],
})
export class WebSocketModule {}
