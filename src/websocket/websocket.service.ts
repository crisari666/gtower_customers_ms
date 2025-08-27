import { Injectable, Logger } from '@nestjs/common';
import { AppWebSocketGateway } from './websocket.gateway';

export interface NotificationData {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  roomId?: string;
}

export interface RoomData {
  id: string;
  name: string;
  description?: string;
  participants: string[];
  createdAt: Date;
}

@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);

  constructor(private readonly webSocketGateway: AppWebSocketGateway) {}

  // Client management
  sendNotificationToClient(clientId: string, notification: NotificationData): void {
    try {
      this.webSocketGateway.sendToClient(clientId, 'notification', {
        ...notification,
        timestamp: new Date(),
      });
      this.logger.log(`Notification sent to client ${clientId}: ${notification.title}`);
    } catch (error) {
      this.logger.error(`Failed to send notification to client ${clientId}:`, error);
    }
  }

  sendNotificationToRoom(roomName: string, notification: NotificationData): void {
    try {
      this.webSocketGateway.sendToRoom(roomName, 'notification', {
        ...notification,
        timestamp: new Date(),
      });
      this.logger.log(`Notification sent to room ${roomName}: ${notification.title}`);
    } catch (error) {
      this.logger.error(`Failed to send notification to room ${roomName}:`, error);
    }
  }

  broadcastNotification(notification: NotificationData): void {
    try {
      this.webSocketGateway.broadcastToAll('notification', {
        ...notification,
        timestamp: new Date(),
      });
      this.logger.log(`Broadcast notification sent: ${notification.title}`);
    } catch (error) {
      this.logger.error('Failed to broadcast notification:', error);
    }
  }

  // Chat functionality
  sendChatMessageToClient(clientId: string, message: ChatMessage): void {
    try {
      this.webSocketGateway.sendToClient(clientId, 'chatMessage', message);
      this.logger.log(`Chat message sent to client ${clientId} from ${message.senderName}`);
    } catch (error) {
      this.logger.error(`Failed to send chat message to client ${clientId}:`, error);
    }
  }

  sendChatMessageToRoom(roomName: string, message: ChatMessage): void {
    try {
      this.webSocketGateway.sendToRoom(roomName, 'chatMessage', message);
      this.logger.log(`Chat message sent to room ${roomName} from ${message.senderName}`);
    } catch (error) {
      this.logger.error(`Failed to send chat message to room ${roomName}:`, error);
    }
  }

  // Custom events
  sendCustomEventToClient(clientId: string, eventName: string, data: any): void {
    try {
      this.webSocketGateway.sendToClient(clientId, eventName, {
        ...data,
        timestamp: new Date(),
      });
      this.logger.log(`Custom event '${eventName}' sent to client ${clientId}`);
    } catch (error) {
      this.logger.error(`Failed to send custom event '${eventName}' to client ${clientId}:`, error);
    }
  }

  sendCustomEventToRoom(roomName: string, eventName: string, data: any): void {
    try {
      this.webSocketGateway.sendToRoom(roomName, eventName, {
        ...data,
        timestamp: new Date(),
      });
      this.logger.log(`Custom event '${eventName}' sent to room ${roomName}`);
    } catch (error) {
      this.logger.error(`Failed to send custom event '${eventName}' to room ${roomName}:`, error);
    }
  }

  broadcastCustomEvent(eventName: string, data: any): void {
    try {
      this.webSocketGateway.broadcastToAll(eventName, {
        ...data,
        timestamp: new Date(),
      });
      this.logger.log(`Custom event '${eventName}' broadcasted to all clients`);
    } catch (error) {
      this.logger.error(`Failed to broadcast custom event '${eventName}':`, error);
    }
  }

  // Status and monitoring
  getConnectedClientsCount(): number {
    return this.webSocketGateway.getConnectedClientsCount();
  }

  getConnectedClients(): any[] {
    return this.webSocketGateway.getConnectedClients();
  }

  isClientConnected(clientId: string): boolean {
    return this.webSocketGateway.isClientConnected(clientId);
  }

  // WhatsApp integration helpers
  sendWhatsAppStatusUpdate(clientId: string, status: string, metadata?: any): void {
    this.sendCustomEventToClient(clientId, 'whatsappStatusUpdate', {
      status,
      metadata,
    });
  }

  sendWhatsAppMessageUpdate(clientId: string, messageData: any): void {
    this.sendCustomEventToClient(clientId, 'whatsappMessageUpdate', messageData);
  }

  sendConversationUpdate(clientId: string, conversationData: any): void {
    this.sendCustomEventToClient(clientId, 'conversationUpdate', conversationData);
  }

  // Customer service helpers
  sendCustomerUpdate(clientId: string, customerData: any): void {
    this.sendCustomEventToClient(clientId, 'customerUpdate', customerData);
  }

  sendCallLogUpdate(clientId: string, callLogData: any): void {
    this.sendCustomEventToClient(clientId, 'callLogUpdate', callLogData);
  }

  // System events
  sendSystemMaintenance(clientId: string, maintenanceInfo: any): void {
    this.sendCustomEventToClient(clientId, 'systemMaintenance', maintenanceInfo);
  }

  broadcastSystemMaintenance(maintenanceInfo: any): void {
    this.broadcastCustomEvent('systemMaintenance', maintenanceInfo);
  }
}
