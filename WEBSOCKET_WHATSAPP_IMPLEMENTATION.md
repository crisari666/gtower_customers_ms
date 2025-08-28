# WhatsApp WebSocket Implementation Guide

This document provides a comprehensive guide for implementing the client-side WebSocket functionality to listen to WhatsApp conversations in real-time.

## Overview

The WebSocket implementation provides real-time updates for:
- All WhatsApp messages (general room)
- Customer-specific messages (customer rooms)
- Message status updates
- Connection management

## WebSocket Events

### Connection Events
- `connected` - Client successfully connected
- `clientJoined` - Another client joined
- `clientLeft` - Another client left

### WhatsApp Events
- `whatsappMessage` - New WhatsApp message received
- `whatsappMessageStatus` - Message status update
- `whatsappGeneralJoined` - Successfully joined general room
- `whatsappCustomerJoined` - Successfully joined customer room
- `whatsappCustomerLeft` - Successfully left customer room

## Room Structure

### General Room
- **Room Name**: `whatsapp:general`
- **Purpose**: Receives all WhatsApp messages and status updates
- **Use Case**: Dashboard, monitoring, analytics

### Customer Rooms
- **Room Name**: `whatsapp:customer:{customerId}`
- **Purpose**: Receives messages and updates for a specific customer
- **Use Case**: Individual chat interfaces, customer support

## Client Implementation

### 1. Basic Connection Setup

```typescript
import { io, Socket } from 'socket.io-client';

class WhatsAppWebSocketClient {
  private socket: Socket;
  private isConnected: boolean = false;

  constructor(serverUrl: string) {
    this.socket = io(serverUrl, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      this.isConnected = false;
    });

    // WhatsApp events
    this.socket.on('whatsappMessage', (message: WhatsAppMessageEvent) => {
      this.handleWhatsAppMessage(message);
    });

    this.socket.on('whatsappMessageStatus', (statusUpdate: any) => {
      this.handleMessageStatusUpdate(statusUpdate);
    });
  }

  // ... rest of implementation
}
```

### 2. Room Management

```typescript
class WhatsAppWebSocketClient {
  // ... previous code ...

  // Join general WhatsApp room
  joinGeneralRoom(): void {
    this.socket.emit('joinWhatsAppGeneral');
  }

  // Join specific customer room
  joinCustomerRoom(customerId: string): void {
    this.socket.emit('joinWhatsAppCustomer', customerId);
  }

  // Leave specific customer room
  leaveCustomerRoom(customerId: string): void {
    this.socket.emit('leaveWhatsAppCustomer', customerId);
  }

  // Handle room join confirmations
  private setupRoomEventListeners(): void {
    this.socket.on('whatsappGeneralJoined', (data: any) => {
      console.log('Joined general WhatsApp room:', data.room);
    });

    this.socket.on('whatsappCustomerJoined', (data: any) => {
      console.log('Joined customer room:', data.room, 'for customer:', data.customerId);
    });

    this.socket.on('whatsappCustomerLeft', (data: any) => {
      console.log('Left customer room:', data.room, 'for customer:', data.customerId);
    });
  }
}
```

### 3. Message Handling

```typescript
interface WhatsAppMessageEvent {
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
  templateName?: string;
  timestamp: Date;
}

class WhatsAppWebSocketClient {
  // ... previous code ...

  private handleWhatsAppMessage(message: WhatsAppMessageEvent): void {
    console.log('New WhatsApp message:', message);
    
    // Emit custom event for your application
    const event = new CustomEvent('whatsappMessage', { detail: message });
    window.dispatchEvent(event);
    
    // Or use a callback system
    if (this.onMessageCallback) {
      this.onMessageCallback(message);
    }
  }

  private handleMessageStatusUpdate(statusUpdate: any): void {
    console.log('Message status update:', statusUpdate);
    
    // Emit custom event for your application
    const event = new CustomEvent('whatsappMessageStatus', { detail: statusUpdate });
    window.dispatchEvent(event);
    
    // Or use a callback system
    if (this.onStatusUpdateCallback) {
      this.onStatusUpdateCallback(statusUpdate);
    }
  }

  // Set message callback
  onMessage(callback: (message: WhatsAppMessageEvent) => void): void {
    this.onMessageCallback = callback;
  }

  // Set status update callback
  onStatusUpdate(callback: (statusUpdate: any) => void): void {
    this.onStatusUpdateCallback = callback;
  }
}
```

### 4. Complete Client Class

```typescript
export class WhatsAppWebSocketClient {
  private socket: Socket;
  private isConnected: boolean = false;
  private onMessageCallback?: (message: WhatsAppMessageEvent) => void;
  private onStatusUpdateCallback?: (statusUpdate: any) => void;

  constructor(serverUrl: string) {
    this.socket = io(serverUrl, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      this.isConnected = false;
    });

    // WhatsApp events
    this.socket.on('whatsappMessage', (message: WhatsAppMessageEvent) => {
      this.handleWhatsAppMessage(message);
    });

    this.socket.on('whatsappMessageStatus', (statusUpdate: any) => {
      this.handleMessageStatusUpdate(statusUpdate);
    });

    // Room events
    this.socket.on('whatsappGeneralJoined', (data: any) => {
      console.log('Joined general WhatsApp room:', data.room);
    });

    this.socket.on('whatsappCustomerJoined', (data: any) => {
      console.log('Joined customer room:', data.room, 'for customer:', data.customerId);
    });

    this.socket.on('whatsappCustomerLeft', (data: any) => {
      console.log('Left customer room:', data.room, 'for customer:', data.customerId);
    });
  }

  // Public methods
  joinGeneralRoom(): void {
    this.socket.emit('joinWhatsAppGeneral');
  }

  joinCustomerRoom(customerId: string): void {
    this.socket.emit('joinWhatsAppCustomer', customerId);
  }

  leaveCustomerRoom(customerId: string): void {
    this.socket.emit('leaveWhatsAppCustomer', customerId);
  }

  onMessage(callback: (message: WhatsAppMessageEvent) => void): void {
    this.onMessageCallback = callback;
  }

  onStatusUpdate(callback: (statusUpdate: any) => void): void {
    this.onStatusUpdateCallback = callback;
  }

  disconnect(): void {
    this.socket.disconnect();
  }

  isConnectedToServer(): boolean {
    return this.isConnected;
  }

  private handleWhatsAppMessage(message: WhatsAppMessageEvent): void {
    if (this.onMessageCallback) {
      this.onMessageCallback(message);
    }
  }

  private handleMessageStatusUpdate(statusUpdate: any): void {
    if (this.onStatusUpdateCallback) {
      this.onStatusUpdateCallback(statusUpdate);
    }
  }
}
```

## Usage Examples

### 1. Dashboard Implementation

```typescript
// Initialize client
const whatsappClient = new WhatsAppWebSocketClient('ws://localhost:3000');

// Join general room for all messages
whatsappClient.joinGeneralRoom();

// Listen to all messages
whatsappClient.onMessage((message) => {
  console.log('New message:', message.content);
  // Update dashboard UI
  updateDashboardMessage(message);
});

// Listen to status updates
whatsappClient.onStatusUpdate((statusUpdate) => {
  console.log('Status update:', statusUpdate);
  // Update message status in UI
  updateMessageStatus(statusUpdate);
});
```

### 2. Individual Chat Implementation

```typescript
class ChatInterface {
  private whatsappClient: WhatsAppWebSocketClient;
  private currentCustomerId: string;

  constructor(serverUrl: string) {
    this.whatsappClient = new WhatsAppWebSocketClient(serverUrl);
    this.setupMessageListener();
  }

  openChat(customerId: string): void {
    // Leave previous customer room if any
    if (this.currentCustomerId) {
      this.whatsappClient.leaveCustomerRoom(this.currentCustomerId);
    }

    // Join new customer room
    this.currentCustomerId = customerId;
    this.whatsappClient.joinCustomerRoom(customerId);
  }

  private setupMessageListener(): void {
    this.whatsappClient.onMessage((message) => {
      // Only show messages for current customer
      if (message.customerId === this.currentCustomerId) {
        this.displayMessage(message);
      }
    });
  }

  private displayMessage(message: WhatsAppMessageEvent): void {
    // Update chat UI with new message
    const messageElement = this.createMessageElement(message);
    this.chatContainer.appendChild(messageElement);
  }
}
```

### 3. React Hook Implementation

```typescript
import { useEffect, useState } from 'react';

export const useWhatsAppWebSocket = (serverUrl: string) => {
  const [messages, setMessages] = useState<WhatsAppMessageEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [client, setClient] = useState<WhatsAppWebSocketClient | null>(null);

  useEffect(() => {
    const whatsappClient = new WhatsAppWebSocketClient(serverUrl);
    setClient(whatsappClient);

    whatsappClient.onMessage((message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      whatsappClient.disconnect();
    };
  }, [serverUrl]);

  const joinGeneralRoom = () => {
    client?.joinGeneralRoom();
  };

  const joinCustomerRoom = (customerId: string) => {
    client?.joinCustomerRoom(customerId);
  };

  const leaveCustomerRoom = (customerId: string) => {
    client?.leaveCustomerRoom(customerId);
  };

  return {
    messages,
    isConnected,
    joinGeneralRoom,
    joinCustomerRoom,
    leaveCustomerRoom,
  };
};
```

## Error Handling

```typescript
class WhatsAppWebSocketClient {
  private setupEventListeners(): void {
    // ... other events ...

    // Error handling
    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.handleConnectionError(error);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.handleSocketError(error);
    });
  }

  private handleConnectionError(error: any): void {
    // Implement retry logic
    setTimeout(() => {
      this.socket.connect();
    }, 5000);
  }

  private handleSocketError(error: any): void {
    // Handle specific socket errors
    console.error('Socket error occurred:', error);
  }
}
```

## Testing

### 1. Test Connection
```typescript
const client = new WhatsAppWebSocketClient('ws://localhost:3000');

client.onMessage((message) => {
  console.log('Test message received:', message);
});

// Join general room
client.joinGeneralRoom();
```

### 2. Test Customer Room
```typescript
// Join specific customer room
client.joinCustomerRoom('customer123');

// Send test message through WhatsApp API
// Should receive real-time update via WebSocket
```

## Security Considerations

1. **Authentication**: Implement JWT or session-based authentication
2. **Authorization**: Ensure users can only join rooms they have access to
3. **Rate Limiting**: Implement rate limiting for room joins/leaves
4. **Input Validation**: Validate all incoming WebSocket messages

## Performance Optimization

1. **Room Management**: Only join necessary rooms
2. **Message Filtering**: Filter messages on client side if needed
3. **Connection Pooling**: Reuse connections when possible
4. **Message Batching**: Batch multiple messages if needed

## Troubleshooting

### Common Issues

1. **Connection Failed**: Check server URL and CORS settings
2. **Messages Not Received**: Verify room membership
3. **High Memory Usage**: Check for memory leaks in event listeners
4. **Disconnections**: Implement automatic reconnection logic

### Debug Mode

```typescript
const client = new WhatsAppWebSocketClient('ws://localhost:3000');

// Enable debug logging
client.socket.onAny((eventName, ...args) => {
  console.log(`Event: ${eventName}`, args);
});
```

This implementation provides a robust, real-time WebSocket solution for WhatsApp conversations with proper room management, error handling, and performance optimization.
