# WebSocket Service Documentation

This document describes the WebSocket service implementation for the GTower Customers application, which provides real-time communication capabilities between clients and the server.

## Overview

The WebSocket service consists of:
- **WebSocketGateway**: Handles WebSocket connections and events
- **WebSocketService**: Provides a clean interface for other services to send WebSocket events
- **WebSocketController**: HTTP endpoints for triggering WebSocket events
- **DTOs**: Data transfer objects for message validation

## Features

- Real-time bidirectional communication
- Room-based messaging
- Client management and monitoring
- Integration with existing services (WhatsApp, Customers, etc.)
- HTTP endpoints for server-side WebSocket event triggering
- CORS support for cross-origin connections

## Installation

The WebSocket dependencies are already installed:

```bash
yarn add @nestjs/websockets @nestjs/platform-socket.io socket.io
```

## Usage

### 1. Basic WebSocket Connection

Clients can connect to the WebSocket server using Socket.IO:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  transports: ['websocket'],
  upgrade: false
});

// Connection events
socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
});
```

### 2. Available Events

#### Client Events (emit from client)
- `message`: Send a message to all clients
- `joinRoom`: Join a specific room
- `leaveRoom`: Leave a specific room
- `roomMessage`: Send a message to a specific room

#### Server Events (listen on client)
- `connected`: Welcome message when connecting
- `messageReceived`: Confirmation of sent message
- `messageBroadcast`: Messages from other clients
- `roomJoined`: Confirmation of joining a room
- `roomLeft`: Confirmation of leaving a room
- `roomMessage`: Messages sent to a specific room
- `clientJoined`: Notification when a new client connects
- `clientLeft`: Notification when a client disconnects
- `notification`: System notifications
- `chatMessage`: Chat messages
- `whatsappStatusUpdate`: WhatsApp status updates
- `whatsappMessageUpdate`: WhatsApp message updates
- `conversationUpdate`: Conversation updates

### 3. Using the WebSocket Service in Other Services

```typescript
import { WebSocketService } from '../websocket/websocket.service';

@Injectable()
export class YourService {
  constructor(private readonly webSocketService: WebSocketService) {}

  async sendNotificationToClient(clientId: string): void {
    this.webSocketService.sendNotificationToClient(clientId, {
      type: 'info',
      title: 'New Message',
      message: 'You have a new message',
    });
  }

  async broadcastToAllClients(): void {
    this.webSocketService.broadcastNotification({
      type: 'success',
      title: 'System Update',
      message: 'System maintenance completed',
    });
  }
}
```

### 4. HTTP Endpoints for WebSocket Events

The WebSocket controller provides HTTP endpoints for server-side event triggering:

#### Notifications
- `POST /websocket/notify/client/:clientId` - Send notification to specific client
- `POST /websocket/notify/room/:roomName` - Send notification to specific room
- `POST /websocket/notify/broadcast` - Broadcast notification to all clients

#### Chat Messages
- `POST /websocket/chat/client/:clientId` - Send chat message to specific client
- `POST /websocket/chat/room/:roomName` - Send chat message to specific room

#### Custom Events
- `POST /websocket/event/client/:clientId/:eventName` - Send custom event to specific client
- `POST /websocket/event/room/:roomName/:eventName` - Send custom event to specific room
- `POST /websocket/event/broadcast/:eventName` - Broadcast custom event to all clients

#### Status and Monitoring
- `GET /websocket/status` - Get WebSocket server status
- `GET /websocket/clients` - Get list of connected clients
- `GET /websocket/clients/:clientId/status` - Get specific client connection status

#### WhatsApp Integration
- `POST /websocket/whatsapp/status/:clientId` - Send WhatsApp status update
- `POST /websocket/whatsapp/message/:clientId` - Send WhatsApp message update
- `POST /websocket/conversation/:clientId` - Send conversation update

### 5. Example HTTP Requests

#### Send notification to a client:
```bash
curl -X POST http://localhost:3000/websocket/notify/client/client123 \
  -H "Content-Type: application/json" \
  -d '{
    "type": "info",
    "title": "Welcome",
    "message": "Welcome to our service!"
  }'
```

#### Broadcast to all clients:
```bash
curl -X POST http://localhost:3000/websocket/notify/broadcast \
  -H "Content-Type: application/json" \
  -d '{
    "type": "warning",
    "title": "Maintenance",
    "message": "Scheduled maintenance in 5 minutes"
  }'
```

#### Send custom event:
```bash
curl -X POST http://localhost:3000/websocket/event/broadcast/userUpdate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "123",
    "action": "profile_updated"
  }'
```

## Configuration

### Environment Variables

```env
CORS_ORIGIN=*  # CORS origin for WebSocket connections
```

### CORS Configuration

The WebSocket gateway is configured with CORS support:

```typescript
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  namespace: '/',
})
```

## Integration Examples

### 1. WhatsApp Service Integration

```typescript
// In whatsapp.service.ts
import { WebSocketService } from '../websocket/websocket.service';

@Injectable()
export class WhatsappService {
  constructor(
    private readonly webSocketService: WebSocketService,
    // ... other dependencies
  ) {}

  async sendMessage(to: string, message: string): Promise<void> {
    // ... existing WhatsApp logic
    
    // Notify connected clients about the new message
    this.webSocketService.broadcastCustomEvent('whatsappMessageSent', {
      to,
      message,
      timestamp: new Date(),
    });
  }
}
```

### 2. Customer Service Integration

```typescript
// In customers.service.ts
import { WebSocketService } from '../websocket/websocket.service';

@Injectable()
export class CustomersService {
  constructor(
    private readonly webSocketService: WebSocketService,
    // ... other dependencies
  ) {}

  async updateCustomer(id: string, data: any): Promise<void> {
    // ... existing update logic
    
    // Notify connected clients about customer update
    this.webSocketService.broadcastCustomEvent('customerUpdated', {
      customerId: id,
      changes: data,
      timestamp: new Date(),
    });
  }
}
```

## Testing

### 1. HTML Client Example

Use the provided `websocket-client-example.html` file to test WebSocket functionality:

1. Open the HTML file in a web browser
2. Ensure your NestJS application is running
3. The client will automatically connect to the WebSocket server
4. Use the interface to test various WebSocket features

### 2. Manual Testing with cURL

Test HTTP endpoints using the examples provided above.

### 3. WebSocket Client Testing

Use tools like:
- [Socket.IO Tester](https://chrome.google.com/webstore/detail/socket-io-tester/cgmimdpepcncnjgclhnhghdooepgebnm)
- [WebSocket King](https://websocketking.com/)
- Browser developer tools

## Security Considerations

1. **CORS Configuration**: Configure appropriate CORS origins for production
2. **Authentication**: Implement authentication for WebSocket connections if needed
3. **Rate Limiting**: Consider implementing rate limiting for WebSocket events
4. **Input Validation**: All incoming WebSocket messages are validated using DTOs

## Performance Considerations

1. **Connection Management**: The service efficiently manages client connections
2. **Memory Usage**: Client information is stored in memory (consider Redis for scaling)
3. **Event Broadcasting**: Use room-based messaging for better performance with many clients

## Troubleshooting

### Common Issues

1. **Connection Refused**: Ensure the NestJS application is running
2. **CORS Errors**: Check CORS configuration and origin settings
3. **Events Not Received**: Verify event names and client connection status
4. **Memory Leaks**: Monitor client connection cleanup

### Debug Mode

Enable debug logging by setting the log level in your NestJS application:

```typescript
// In main.ts
const app = await NestFactory.create(AppModule, {
  logger: ['debug', 'log', 'warn', 'error'],
});
```

## Future Enhancements

1. **Redis Adapter**: Implement Redis adapter for horizontal scaling
2. **Authentication**: Add JWT-based authentication for WebSocket connections
3. **Rate Limiting**: Implement rate limiting for WebSocket events
4. **Message Persistence**: Store WebSocket messages in database
5. **Analytics**: Add WebSocket usage analytics and monitoring

## Support

For issues or questions regarding the WebSocket service, please refer to:
- NestJS WebSocket documentation
- Socket.IO documentation
- Project maintainers
