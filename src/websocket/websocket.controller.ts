import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { WebSocketService } from './websocket.service';
import { NotificationDto, ChatMessageDto } from './dto/websocket-message.dto';

@Controller('websocket')
export class WebSocketController {
  constructor(private readonly webSocketService: WebSocketService) {}

  @Post('notify/client/:clientId')
  sendNotificationToClient(
    @Param('clientId') clientId: string,
    @Body() notification: NotificationDto,
  ): { success: boolean; message: string } {
    try {
      this.webSocketService.sendNotificationToClient(clientId, notification);
      return {
        success: true,
        message: `Notification sent to client ${clientId}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to send notification: ${error.message}`,
      };
    }
  }

  @Post('notify/room/:roomName')
  sendNotificationToRoom(
    @Param('roomName') roomName: string,
    @Body() notification: NotificationDto,
  ): { success: boolean; message: string } {
    try {
      this.webSocketService.sendNotificationToRoom(roomName, notification);
      return {
        success: true,
        message: `Notification sent to room ${roomName}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to send notification: ${error.message}`,
      };
    }
  }

  @Post('notify/broadcast')
  broadcastNotification(@Body() notification: NotificationDto): { success: boolean; message: string } {
    try {
      this.webSocketService.broadcastNotification(notification);
      return {
        success: true,
        message: 'Notification broadcasted to all clients',
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to broadcast notification: ${error.message}`,
      };
    }
  }

  @Post('chat/client/:clientId')
  sendChatMessageToClient(
    @Param('clientId') clientId: string,
    @Body() message: ChatMessageDto,
  ): { success: boolean; message: string } {
    try {
      // Ensure timestamp is set if not provided
      const messageWithTimestamp = {
        ...message,
        timestamp: message.timestamp || new Date(),
      };
      
      this.webSocketService.sendChatMessageToClient(clientId, messageWithTimestamp as any);
      return {
        success: true,
        message: `Chat message sent to client ${clientId}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to send chat message: ${error.message}`,
      };
    }
  }

  @Post('chat/room/:roomName')
  sendChatMessageToRoom(
    @Param('roomName') roomName: string,
    @Body() message: ChatMessageDto,
  ): { success: boolean; message: string } {
    try {
      // Ensure timestamp is set if not provided
      const messageWithTimestamp = {
        ...message,
        timestamp: message.timestamp || new Date(),
      };
      
      this.webSocketService.sendChatMessageToRoom(roomName, messageWithTimestamp as any);
      return {
        success: true,
        message: `Chat message sent to room ${roomName}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to send chat message: ${error.message}`,
      };
    }
  }

  @Post('event/client/:clientId/:eventName')
  sendCustomEventToClient(
    @Param('clientId') clientId: string,
    @Param('eventName') eventName: string,
    @Body() data: any,
  ): { success: boolean; message: string } {
    try {
      this.webSocketService.sendCustomEventToClient(clientId, eventName, data);
      return {
        success: true,
        message: `Custom event '${eventName}' sent to client ${clientId}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to send custom event: ${error.message}`,
      };
    }
  }

  @Post('event/room/:roomName/:eventName')
  sendCustomEventToRoom(
    @Param('roomName') roomName: string,
    @Param('eventName') eventName: string,
    @Body() data: any,
  ): { success: boolean; message: string } {
    try {
      this.webSocketService.sendCustomEventToRoom(roomName, eventName, data);
      return {
        success: true,
        message: `Custom event '${eventName}' sent to room ${roomName}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to send custom event: ${error.message}`,
      };
    }
  }

  @Post('event/broadcast/:eventName')
  broadcastCustomEvent(
    @Param('eventName') eventName: string,
    @Body() data: any,
  ): { success: boolean; message: string } {
    try {
      this.webSocketService.broadcastCustomEvent(eventName, data);
      return {
        success: true,
        message: `Custom event '${eventName}' broadcasted to all clients`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to broadcast custom event: ${error.message}`,
      };
    }
  }

  @Get('status')
  getWebSocketStatus(): {
    connectedClients: number;
    status: string;
    timestamp: Date;
  } {
    return {
      connectedClients: this.webSocketService.getConnectedClientsCount(),
      status: 'active',
      timestamp: new Date(),
    };
  }

  @Get('clients')
  getConnectedClients(): any[] {
    return this.webSocketService.getConnectedClients();
  }

  @Get('clients/:clientId/status')
  getClientStatus(@Param('clientId') clientId: string): {
    clientId: string;
    connected: boolean;
    timestamp: Date;
  } {
    return {
      clientId,
      connected: this.webSocketService.isClientConnected(clientId),
      timestamp: new Date(),
    };
  }

  // WhatsApp integration endpoints
  @Post('whatsapp/status/:clientId')
  sendWhatsAppStatusUpdate(
    @Param('clientId') clientId: string,
    @Body() data: { status: string; metadata?: any },
  ): { success: boolean; message: string } {
    try {
      this.webSocketService.sendWhatsAppStatusUpdate(clientId, data.status, data.metadata);
      return {
        success: true,
        message: `WhatsApp status update sent to client ${clientId}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to send WhatsApp status update: ${error.message}`,
      };
    }
  }

  @Post('whatsapp/message/:clientId')
  sendWhatsAppMessageUpdate(
    @Param('clientId') clientId: string,
    @Body() messageData: any,
  ): { success: boolean; message: string } {
    try {
      this.webSocketService.sendWhatsAppMessageUpdate(clientId, messageData);
      return {
        success: true,
        message: `WhatsApp message update sent to client ${clientId}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to send WhatsApp message update: ${error.message}`,
      };
    }
  }

  @Post('conversation/:clientId')
  sendConversationUpdate(
    @Param('clientId') clientId: string,
    @Body() conversationData: any,
  ): { success: boolean; message: string } {
    try {
      this.webSocketService.sendConversationUpdate(clientId, conversationData);
      return {
        success: true,
        message: `Conversation update sent to client ${clientId}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to send conversation update: ${error.message}`,
      };
    }
  }
}
