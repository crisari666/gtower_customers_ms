# AI Text Agent Feature for WhatsApp Business

## Overview

This feature implements a comprehensive AI text agent system for WhatsApp Business that can:
- Start conversations with customers using template messages
- Store and manage conversation history
- Process incoming customer messages
- Send automated responses based on message content
- Track message delivery status
- Provide conversation analytics

## Architecture

### Core Entities

#### 1. Conversation Entity (`conversation.entity.ts`)
- Links customers to their WhatsApp conversations
- Tracks conversation status (active, closed, archived)
- Stores metadata like last message time and message count
- Maintains conversation state and origin

#### 2. Message Entity (`message.entity.ts`)
- Stores individual messages in conversations
- Tracks message status (pending, sent, delivered, read, failed)
- Supports multiple message types (text, template, image, audio, video, document)
- Stores WhatsApp message IDs for status tracking
- Includes metadata and template information

### Services

#### 1. ConversationService (`conversation.service.ts`)
- Manages conversation lifecycle
- Handles message creation and updates
- Provides conversation history and analytics
- Manages conversation status updates

#### 2. WhatsappService (`whatsapp.service.ts`)
- Handles WhatsApp Business API communication
- Sends template and text messages
- Integrates with conversation system
- Manages message delivery tracking

#### 3. AiAgentService (`ai-agent.service.ts`)
- Processes customer messages automatically
- Generates intelligent responses
- Manages automated conversation flows
- Provides conversation analytics

## API Endpoints

### Starting Conversations

#### POST `/whatsapp/start-conversation`
Starts a new conversation with a customer using a template message.

**Request Body:**
```json
{
  "customerId": "507f1f77bcf86cd799439011",
  "templateName": "hello_world",
  "languageCode": "en_US",
  "customMessage": "Optional custom message"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messaging_product": "whatsapp",
    "contacts": [...],
    "messages": [...]
  },
  "conversationId": "507f1f77bcf86cd799439012"
}
```

### Sending Messages

#### POST `/whatsapp/send-message`
Sends a text message to a customer.

**Request Body:**
```json
{
  "to": "573108834323",
  "message": "Hello! How can I help you today?"
}
```

### Getting Conversation History

#### GET `/whatsapp/conversation/:customerId`
Retrieves the complete conversation history for a customer.

**Response:**
```json
{
  "success": true,
  "data": {
    "conversation": {
      "customerId": "507f1f77bcf86cd799439011",
      "whatsappNumber": "573108834323",
      "status": "active",
      "messageCount": 15,
      "lastMessageAt": "2024-01-15T10:30:00.000Z"
    },
    "messages": [
      {
        "senderType": "agent",
        "messageType": "template",
        "content": "Template: hello_world",
        "status": "delivered",
        "createdAt": "2024-01-15T10:00:00.000Z"
      },
      {
        "senderType": "customer",
        "messageType": "text",
        "content": "Hello there!",
        "status": "delivered",
        "createdAt": "2024-01-15T10:05:00.000Z"
      }
    ]
  }
}
```

## Webhook Processing

### Webhook Endpoint
`POST /whatsapp/webhook`

The webhook processes various types of WhatsApp events:

#### 1. Message Status Updates
When messages are sent, delivered, or read:
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "statuses": [{
          "id": "wamid.HBgMNTczMTA4ODM0MzIzFQIAERgSOTJFQUZBMUMzNTREREVBOTBDAA==",
          "status": "delivered",
          "timestamp": "1755290296",
          "recipient_id": "573108834323"
        }]
      }
    }]
  }]
}
```

#### 2. Incoming Customer Messages
When customers send messages:
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "573108834323",
          "id": "wamid.HBgMNTczMTA4ODM0MzIzFQIAEhggMTE0MjFGODY1MEJEMDA1MDc2MkQ5RThFQUIzODg1RjYA",
          "text": { "body": "Yes bro" },
          "type": "text"
        }]
      }
    }]
  }]
}
```

## AI Agent Features

### Automated Responses
The AI agent automatically responds to common customer messages:

- **Greetings**: "Hello! Thank you for reaching out. How can I assist you today?"
- **Help Requests**: "I'm here to help! What specific assistance do you need?"
- **Pricing Inquiries**: "I'd be happy to help you with pricing information. Could you provide more details about what you're looking for?"
- **Appointment Requests**: "To schedule an appointment, please let me know your preferred date and time, and I'll check our availability."
- **Thank You Messages**: "You're welcome! Is there anything else I can help you with?"
- **Goodbyes**: "Thank you for chatting with us! Have a great day. If you need anything else, feel free to reach out."

### Conversation Analytics
The system provides detailed analytics for each conversation:

- Total message count
- Customer vs. agent message ratio
- Average response time
- Conversation status and duration
- Last activity timestamp

## Database Schema

### Conversation Collection
```javascript
{
  _id: ObjectId,
  customerId: ObjectId, // Reference to Customer
  whatsappNumber: String,
  conversationId: String, // WhatsApp conversation ID
  status: String, // "active", "closed", "archived"
  lastMessageAt: Date,
  messageCount: Number,
  lastMessageFrom: String, // "agent" or "customer"
  createdAt: Date,
  updatedAt: Date
}
```

### Message Collection
```javascript
{
  _id: ObjectId,
  conversationId: ObjectId, // Reference to Conversation
  customerId: ObjectId, // Reference to Customer
  whatsappNumber: String,
  whatsappMessageId: String, // WhatsApp message ID
  senderType: String, // "agent" or "customer"
  messageType: String, // "text", "template", "image", etc.
  content: String,
  status: String, // "pending", "sent", "delivered", "read", "failed"
  sentAt: Date,
  deliveredAt: Date,
  readAt: Date,
  isTemplate: Boolean,
  templateName: String,
  metadata: Object,
  createdAt: Date,
  updatedAt: Date
}
```

## Usage Examples

### Starting a Conversation
```typescript
// Start conversation with hello_world template
const result = await whatsappService.startConversation({
  customerId: '507f1f77bcf86cd799439011',
  templateName: 'hello_world',
  languageCode: 'en_US'
});
```

### Sending a Follow-up Message
```typescript
// Send automated follow-up
await aiAgentService.sendFollowUpMessage(
  '507f1f77bcf86cd799439011',
  'Thank you for your interest! Our team will contact you soon.'
);
```

### Getting Analytics
```typescript
// Get conversation analytics
const analytics = await aiAgentService.getConversationAnalytics(
  '507f1f77bcf86cd799439011'
);
```

## Environment Variables

Required environment variables:
```bash
WHATSAPP_TOKEN=your_whatsapp_business_token
MONGODB_URI=your_mongodb_connection_string
```

## Future Enhancements

1. **Advanced AI Integration**: Integrate with OpenAI GPT or similar for more intelligent responses
2. **Sentiment Analysis**: Analyze customer message sentiment for better response selection
3. **Multi-language Support**: Support for multiple languages and localization
4. **Conversation Routing**: Route complex queries to human agents
5. **Rich Media Support**: Enhanced support for images, documents, and interactive messages
6. **Scheduled Messages**: Send messages at specific times or dates
7. **Conversation Templates**: Pre-defined conversation flows for common scenarios

## Testing

The system includes comprehensive testing for:
- Webhook processing
- Message status updates
- Conversation creation and management
- AI response generation
- Error handling and edge cases

## Security Considerations

- Webhook verification for WhatsApp Business API
- Input validation and sanitization
- Rate limiting for message sending
- Secure storage of conversation data
- Access control for conversation history
