# AI Text Agent Feature for WhatsApp Business

## Overview

This feature implements a comprehensive AI text agent system for WhatsApp Business that can:
- Start conversations with customers using template messages
- Store and manage conversation history
- Process incoming customer messages
- Send automated responses based on message content
- Track message delivery status
- Provide conversation analytics
- **NEW: Integrate with LangChain for advanced AI capabilities**

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
- Generates intelligent responses using LangChain
- Manages automated conversation flows
- Provides conversation analytics and insights

#### 4. **NEW: LangChainService (`langchain.service.ts`)**
- Integrates with OpenAI models
- Provides intelligent response generation
- Analyzes customer sentiment
- Generates conversation summaries
- Creates follow-up suggestions
- Falls back to rule-based responses when AI is unavailable

## LangChain Integration Features

### Supported AI Models

#### OpenAI Models
- **gpt-3.5-turbo**: Fast, cost-effective, good for most use cases
- **gpt-4**: More capable, better reasoning, higher cost
- **gpt-4-turbo**: Latest GPT-4 model with extended knowledge

### AI Capabilities

1. **Intelligent Response Generation**
   - Context-aware responses based on conversation history
   - Professional and helpful tone
   - Automatic fallback to rule-based responses

2. **Sentiment Analysis**
   - Real-time customer sentiment detection
   - Confidence scoring for sentiment analysis
   - Reasoning for sentiment classification

3. **Conversation Summarization**
   - AI-generated conversation summaries
   - Key points and action items extraction
   - Context preservation for follow-ups

4. **Follow-up Suggestions**
   - Intelligent follow-up questions
   - Context-aware conversation progression
   - Multiple suggestion options

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

### **NEW: AI-Powered Endpoints**

#### POST `/whatsapp/ai/process-message`
Process a customer message with AI and send an automated response.

**Request Body:**
```json
{
  "whatsappNumber": "573108834323",
  "message": "Hello, I need help with pricing"
}
```

#### POST `/whatsapp/ai/intelligent-follow-up/:customerId`
Send an intelligent follow-up message to a customer based on conversation context.

#### GET `/whatsapp/ai/analytics/:customerId`
Get enhanced conversation analytics including AI-generated insights.

**Response:**
```json
{
  "success": true,
  "data": {
    "conversationId": "507f1f77bcf86cd799439012",
    "customerId": "507f1f77bcf86cd799439011",
    "messageCount": 15,
    "conversationDuration": "2h 30m",
    "overallSentiment": {
      "sentiment": "positive",
      "confidence": 0.85,
      "reasoning": "Customer shows satisfaction with responses"
    },
    "followUpSuggestions": [
      "Would you like me to send you our pricing brochure?",
      "Can I schedule a follow-up call to discuss your requirements?",
      "Is there anything specific about our services you'd like to know more about?"
    ],
    "aiModelStatus": {
      "openai": true,
      "default": "openai"
    },
    "conversationSummary": "Customer inquired about pricing for enterprise services. Provided initial pricing information and discussed basic requirements. Customer showed interest and requested more details."
  }
}
```

#### GET `/whatsapp/ai/model-status`
Get the status of configured AI models.

**Response:**
```json
{
  "success": true,
  "data": {
    "openai": true,
    "default": "openai"
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
The AI agent automatically responds to customer messages using LangChain:

- **Intelligent Context Understanding**: Analyzes conversation history for context
- **Professional Tone**: Maintains business-appropriate communication style
- **Fallback System**: Automatically falls back to rule-based responses when AI is unavailable
- **Sentiment Awareness**: Adjusts responses based on customer emotional state

### Conversation Analytics
The system provides detailed analytics for each conversation:

- Total message count
- Customer vs. agent message ratio
- Average response time
- Conversation status and duration
- Last activity timestamp
- **NEW: AI-generated conversation summary**
- **NEW: Customer sentiment analysis**
- **NEW: Intelligent follow-up suggestions**

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

### Processing Messages with AI
```typescript
// Process customer message with AI
await aiAgentService.processCustomerMessage(
  '573108834323',
  'Hello, I need help with pricing'
);
```

### Sending Intelligent Follow-ups
```typescript
// Send AI-generated follow-up
const result = await aiAgentService.sendIntelligentFollowUp(
  '507f1f77bcf86cd799439011'
);
```

### Getting Enhanced Analytics
```typescript
// Get AI-powered conversation insights
const insights = await aiAgentService.getEnhancedConversationInsights(
  '507f1f77bcf86cd799439011'
);
```

## Environment Variables

Required environment variables:
```bash
WHATSAPP_TOKEN=your_whatsapp_business_token
MONGODB_URI=your_mongodb_connection_string

# Optional: OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=1000
```

## Cost Management

### AI Model Pricing (as of 2024)
- **OpenAI GPT-3.5-turbo**: $0.0015 per 1K input tokens, $0.002 per 1K output tokens
- **OpenAI GPT-4**: $0.03 per 1K input tokens, $0.06 per 1K output tokens

### Cost Optimization
- Automatic fallback to rule-based responses when AI is unavailable
- Configurable token limits
- Conversation length management
- Response caching capabilities

## Future Enhancements

1. **Advanced AI Integration**: 
   - Vector database integration for semantic search
   - Custom model fine-tuning
   - Multi-modal support (images, documents)

2. **Enhanced Analytics**: 
   - Real-time sentiment tracking
   - Customer satisfaction scoring
   - Predictive conversation routing

3. **Advanced Automation**: 
   - Scheduled follow-ups
   - Conversation escalation rules
   - Integration with CRM systems

4. **Performance Optimization**: 
   - Response caching
   - Async processing
   - Load balancing for AI models

## Testing

The system includes comprehensive testing for:
- Webhook processing
- Message status updates
- Conversation creation and management
- AI response generation
- LangChain integration
- Error handling and edge cases
- Fallback mechanisms

## Security Considerations

- Webhook verification for WhatsApp Business API
- Input validation and sanitization
- Rate limiting for message sending and AI processing
- Secure storage of conversation data
- Access control for conversation history
- **NEW: API key security for AI services**
- **NEW: Data privacy compliance for AI processing**

## Monitoring and Logging

The system provides comprehensive logging for:
- WhatsApp API interactions
- Conversation management
- AI model usage and performance
- Error handling and fallbacks
- Cost tracking for AI services
- Customer sentiment trends
