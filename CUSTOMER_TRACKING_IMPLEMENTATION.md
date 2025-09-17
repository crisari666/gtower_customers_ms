# Customer Tracking Implementation

## Overview
This document describes the implementation of customer tracking functionality to monitor when messages are sent to customers and when they reply for the first time.

## Features Implemented

### 1. Customer Entity Updates
- Added `firstMessageSent` field (boolean) to track when the first message is sent to a customer
- Added `replied` field (boolean) to track when a customer replies for the first time

### 2. Customer Service Methods
- `markFirstMessageSent(customerId: string)`: Marks a customer as having received their first message
- `markCustomerReplied(customerId: string)`: Marks a customer as having replied for the first time

### 3. Conversation Service Integration
- Modified `createMessage()` method to automatically track when agent messages are sent to customers
- Automatically calls `markFirstMessageSent()` when an agent message is created

### 4. Webhook Processing
- Enhanced webhook processing to detect customer replies
- Automatically calls `markCustomerReplied()` when a customer message is received
- Integrated with existing AI agent processing flow

### 5. Chats Service Enhancements
- Added `getCustomerReplyStatus()` method to retrieve customer engagement status
- Added `getCustomerEngagementStats()` method to get overall engagement statistics
- Added helper methods for manual tracking updates

### 6. API Endpoints
- `GET /chats/customer/:customerId/reply-status`: Get individual customer reply status
- `GET /chats/engagement-stats`: Get overall customer engagement statistics

## How It Works

### Message Sent Tracking
1. When an agent sends a message (via `sendTextMessage`, `sendTemplateMessage`, or `startConversation`)
2. The `createMessage()` method in `ConversationService` is called
3. If `senderType === 'agent'`, it automatically calls `markFirstMessageSent()`
4. The customer's `firstMessageSent` field is set to `true`

### Customer Reply Tracking
1. When a customer sends a message, the webhook is triggered
2. `processCustomerMessage()` in `WhatsappController` processes the incoming message
3. After creating the message record, it calls `markCustomerReplied()`
4. The customer's `replied` field is set to `true`

### Business Logic
- Both tracking operations only update the fields if they're currently `false`
- This prevents unnecessary database updates
- The tracking is automatic and requires no manual intervention

## Database Schema

```typescript
@Schema({ timestamps: true })
export class Customer {
  // ... existing fields ...
  
  @Prop({ default: false })
  firstMessageSent: boolean;
  
  @Prop({ default: false })
  replied: boolean;
}
```

## API Response Examples

### Customer Reply Status
```json
{
  "firstMessageSent": true,
  "replied": false
}
```

### Engagement Statistics
```json
{
  "totalCustomers": 150,
  "customersWithFirstMessage": 120,
  "customersWhoReplied": 85,
  "engagementRate": 56.67
}
```

## Integration Points

### Services Modified
- `CustomersService`: Added tracking methods
- `ConversationService`: Enhanced message creation
- `ChatsService`: Added business logic and statistics
- `WhatsappController`: Enhanced webhook processing

### Modules Updated
- `ChatsModule`: Added `CustomersService` dependency
- `WhatsappModule`: Already had `CustomersService` dependency

## Benefits

1. **Automatic Tracking**: No manual intervention required
2. **Real-time Updates**: Immediate status updates via webhooks
3. **Business Intelligence**: Track engagement rates and customer behavior
4. **Performance**: Efficient database operations with conditional updates
5. **Scalability**: Works with existing architecture and database design

## Usage Examples

### Check Customer Status
```typescript
const status = await chatsService.getCustomerReplyStatus(customerId);
if (status.firstMessageSent && !status.replied) {
  // Customer received message but hasn't replied yet
}
```

### Get Engagement Metrics
```typescript
const stats = await chatsService.getCustomerEngagementStats();
console.log(`Engagement Rate: ${stats.engagementRate}%`);
```

## Future Enhancements

1. **Timing Analytics**: Track time between first message and reply
2. **Response Quality**: Analyze customer response sentiment and content
3. **Campaign Tracking**: Track which templates/messages generate better responses
4. **Notification System**: Alert agents when customers reply for the first time
5. **Reporting Dashboard**: Visual representation of engagement metrics
