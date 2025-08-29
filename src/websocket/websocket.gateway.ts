import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

// WhatsApp WebSocket constants
export const WHATSAPP_ROOMS = {
  GENERAL: 'whatsapp:general',
  CUSTOMER: (customerId: string) => `whatsapp:customer:${customerId}`,
} as const;

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: Date;
}

export interface ClientInfo {
  id: string;
  connectedAt: Date;
  metadata?: Record<string, any>;
}

// WhatsApp message interface based on Message entity
export interface WhatsAppMessageEvent {
  conversationId: string;
  customerId: string;
  whatsappNumber: string;
  whatsappMessageId: string;
  senderType: 'agent' | 'customer';
  messageType: string;
  content: string;
  status: string;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  metadata?: Record<string, any>;
  isTemplate: boolean;
  templateName: string;
  createdAt?: Date;
  updatedAt?: Date;
  timestamp: Date;
}

export interface CustomerProspectStatusEvent {
  customerId: string;
  isProspect: boolean;
  prospectDate: Date;
  prospectSource: string;
  additionalNotes?: string;
  timestamp: Date;
}

export interface WhatsAppWebhookEvent {
  type: 'verification' | 'message' | 'status';
  challenge?: string;
  data: any;
  timestamp: Date;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  namespace: '/websocket',
})
export class AppWebSocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);
  private readonly connectedClients = new Map<string, ClientInfo>();

  afterInit(): void {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket): void {
    const clientInfo: ClientInfo = {
      id: client.id,
      connectedAt: new Date(),
      metadata: {
        userAgent: client.handshake.headers['user-agent'],
        ip: client.handshake.address,
      },
    };

    this.connectedClients.set(client.id, clientInfo);
    this.logger.log(
      `New WebSocket connection established:
      - Client ID: ${client.id}
      - IP Address: ${clientInfo.metadata.ip}
      - User Agent: ${clientInfo.metadata.userAgent}
      - Connected At: ${clientInfo.connectedAt.toISOString()}`
    );
    
    // Send welcome message
    client.emit('connected', {
      message: 'Successfully connected to WebSocket server',
      clientId: client.id,
      timestamp: new Date(),
    });

    // Broadcast to other clients that a new client joined
    client.broadcast.emit('clientJoined', {
      clientId: client.id,
      timestamp: new Date(),
    });
  }

  handleDisconnect(client: Socket): void {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Broadcast to other clients that a client left
    client.broadcast.emit('clientLeft', {
      clientId: client.id,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() message: WebSocketMessage,
    @ConnectedSocket() client: Socket,
  ): void {
    this.logger.log(`Received message from ${client.id}: ${JSON.stringify(message)}`);
    
    // Echo the message back to the sender
    client.emit('messageReceived', {
      originalMessage: message,
      receivedAt: new Date(),
    });

    // Broadcast to all other clients
    client.broadcast.emit('messageBroadcast', {
      from: client.id,
      message,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() roomName: string,
    @ConnectedSocket() client: Socket,
  ): void {
    client.join(roomName);
    this.logger.log(`Client ${client.id} joined room: ${roomName}`);
    
    client.emit('roomJoined', {
      room: roomName,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() roomName: string,
    @ConnectedSocket() client: Socket,
  ): void {
    client.leave(roomName);
    this.logger.log(`Client ${client.id} left room: ${roomName}`);
    
    client.emit('roomLeft', {
      room: roomName,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('roomMessage')
  handleRoomMessage(
    @MessageBody() data: { room: string; message: WebSocketMessage },
    @ConnectedSocket() client: Socket,
  ): void {
    this.logger.log(`Room message from ${client.id} to ${data.room}: ${JSON.stringify(data.message)}`);
    
    // Send to all clients in the room (including sender)
    this.server.to(data.room).emit('roomMessage', {
      from: client.id,
      room: data.room,
      message: data.message,
      timestamp: new Date(),
    });
  }

  // WhatsApp-specific methods
  @SubscribeMessage('joinWhatsAppGeneral')
  handleJoinWhatsAppGeneral(@ConnectedSocket() client: Socket): void {
    const roomName = WHATSAPP_ROOMS.GENERAL;
    client.join(roomName);
    this.logger.log(`Client ${client.id} joined WhatsApp general room`);
    
    client.emit('whatsappGeneralJoined', {
      room: roomName,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('joinWhatsAppCustomer')
  handleJoinWhatsAppCustomer(
    @MessageBody() customerId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    const roomName = WHATSAPP_ROOMS.CUSTOMER(customerId);
    client.join(roomName);
    this.logger.log(`Client ${client.id} joined WhatsApp customer room: ${customerId}`);
    
    client.emit('whatsappCustomerJoined', {
      room: roomName,
      customerId,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('leaveWhatsAppCustomer')
  handleLeaveWhatsAppCustomer(
    @MessageBody() customerId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    const roomName = WHATSAPP_ROOMS.CUSTOMER(customerId);
    client.leave(roomName);
    this.logger.log(`Client ${client.id} left WhatsApp customer room: ${customerId}`);
    
    client.emit('whatsappCustomerLeft', {
      room: roomName,
      customerId,
      timestamp: new Date(),
    });
  }

  // Public methods for other services to use
  sendToClient(clientId: string, event: string, data: any): void {
    const client = this.server.sockets.sockets.get(clientId);
    if (client) {
      client.emit(event, data);
    } else {
      this.logger.warn(`Client ${clientId} not found`);
    }
  }

  sendToRoom(roomName: string, event: string, data: any): void {
    this.server.to(roomName).emit(event, data);
  }

  broadcastToAll(event: string, data: any): void {
    this.server.emit(event, data);
  }

  // WhatsApp-specific emission methods
  emitWhatsAppMessage(message: WhatsAppMessageEvent): void {
    // Emit to general room
    this.sendToRoom(WHATSAPP_ROOMS.GENERAL, 'whatsappMessage', message);
    
    this.broadcastToAll('whatsappMessage', message);
    
    // Emit to specific customer room
    const customerRoom = WHATSAPP_ROOMS.CUSTOMER(message.customerId);
    this.sendToRoom(customerRoom, 'whatsappMessage', message);
    
    this.logger.log(`WhatsApp message emitted to rooms: general and ${customerRoom}`);
  }

  emitWhatsAppMessageStatus(messageId: string, status: string, customerId: string): void {
    const statusUpdate = {
      messageId,
      status,
      customerId,
      timestamp: new Date(),
    };
    
    // Emit to general room
    this.sendToRoom(WHATSAPP_ROOMS.GENERAL, 'whatsappMessageStatus', statusUpdate);
    
    // Emit to specific customer room
    const customerRoom = WHATSAPP_ROOMS.CUSTOMER(customerId);
    this.sendToRoom(customerRoom, 'whatsappMessageStatus', statusUpdate);
    
    //this.logger.log(`WhatsApp message status update emitted: ${messageId} -> ${status}`);
  }

  emitCustomerProspectStatus(event: CustomerProspectStatusEvent): void {
    const statusUpdate = {
      customerId: event.customerId,
      isProspect: event.isProspect,
      prospectDate: event.prospectDate,
      prospectSource: event.prospectSource,
      additionalNotes: event.additionalNotes,
      timestamp: new Date(),
    };

    // Emit to general room
    this.sendToRoom(WHATSAPP_ROOMS.GENERAL, 'customerProspectStatus', statusUpdate);

    // Emit to specific customer room
    const customerRoom = WHATSAPP_ROOMS.CUSTOMER(event.customerId);
    this.sendToRoom(customerRoom, 'customerProspectStatus', statusUpdate);

    this.logger.log(`Customer prospect status update emitted: ${event.customerId} -> ${event.isProspect}`);
  }

  getConnectedClients(): ClientInfo[] {
    return Array.from(this.connectedClients.values());
  }

  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  isClientConnected(clientId: string): boolean {
    return this.connectedClients.has(clientId);
  }

  emitWebhookEvent(event: WhatsAppWebhookEvent): void {
    this.broadcastToAll('whatsappWebhook', event);
    this.logger.log(`WhatsApp webhook event emitted: ${event.type}`);
  }
}
