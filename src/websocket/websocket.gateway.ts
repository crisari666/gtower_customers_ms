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

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  namespace: '/',
})
export class AppWebSocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);
  private readonly connectedClients = new Map<string, ClientInfo>();

  afterInit(server: Server): void {
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
    this.logger.log(`Client connected: ${client.id}`);
    
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

  getConnectedClients(): ClientInfo[] {
    return Array.from(this.connectedClients.values());
  }

  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  isClientConnected(clientId: string): boolean {
    return this.connectedClients.has(clientId);
  }
}
