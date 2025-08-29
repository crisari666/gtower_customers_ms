# Customer Sentiment Analysis System

This system provides comprehensive sentiment analysis and lead qualification for customer conversations, storing both current sentiment status and historical data for sales intelligence.

## Project Structure

```
src/
├── sentiment/                    # Sentiment Analysis Module
│   ├── entities/                # Database entities
│   │   ├── customer-sentiment.entity.ts
│   │   └── customer-sentiment-history.entity.ts
│   ├── dto/                     # Data Transfer Objects
│   │   └── sentiment-analysis.dto.ts
│   ├── services/                # Business logic
│   │   └── customer-sentiment.service.ts
│   ├── controllers/             # API endpoints
│   │   └── customer-sentiment.controller.ts
│   ├── sentiment.module.ts      # Module configuration
│   └── index.ts                 # Export barrel
├── customers/                   # Customer Management Module
├── whatsapp/                    # WhatsApp Integration Module
└── app.module.ts                # Main application module
```

## Features

### 🎯 Lead Qualification
- **Urgency Assessment**: High, Medium, Low
- **Buying Intent**: Strong, Moderate, Weak, None
- **Budget Indication**: High, Medium, Low, Unknown
- **Decision Maker Status**: Boolean
- **Timeline**: Immediate, Short-term, Long-term, Unknown

### 📊 Customer Profiling
- **Expertise Level**: Beginner, Intermediate, Expert
- **Industry Detection**: Automatic industry identification
- **Company Size**: Startup, Small, Medium, Large, Enterprise
- **Role**: Job title/position detection
- **Communication Style**: Formal, Casual, Technical, Business

### 🔍 Sales Intelligence
- **Pain Points**: Specific problems mentioned
- **Objections**: Concerns and barriers
- **Positive Signals**: Interest indicators
- **Risk Factors**: Potential issues
- **Next Best Action**: Specific sales recommendations

## Database Entities

### 1. CustomerSentiment (Current Status)
Stores the latest sentiment analysis for each customer:
- Customer ID reference
- Current sentiment and confidence
- Lead qualification metrics
- Customer profile data
- Last message and conversation count

### 2. CustomerSentimentHistory (Historical Data)
Stores complete sentiment analysis history:
- All previous analyses
- Message context and conversation IDs
- Analysis triggers (message, manual, scheduled)
- Timestamps for trend analysis

## API Endpoints

### Base URL: `/sentiment`

### Customer Sentiment Data
```
GET /sentiment/current/:customerId
GET /sentiment/history/:customerId?limit=50&offset=0
```

### Sentiment Metrics & Analytics
```
GET /sentiment/metrics?sentiment=positive&urgency=high
GET /sentiment/analytics/trends?startDate=2024-01-01&endDate=2024-01-31
GET /sentiment/analytics/pain-points
GET /sentiment/analytics/objections
```

### Customer Segmentation
```
GET /sentiment/customers/positive?limit=20&offset=0
GET /sentiment/customers/negative?limit=20&offset=0
GET /sentiment/customers/neutral?limit=20&offset=0
```

### High-Priority Leads
```
GET /sentiment/leads/high-priority?limit=20
GET /sentiment/leads/urgent?limit=20
GET /sentiment/leads/strong-intent?limit=20
```

### Manual Analysis
```
POST /sentiment/analyze
```

### Data Management
```
DELETE /sentiment/:customerId
```

## Usage Examples

### 1. Analyze and Save Sentiment
```typescript
// In your WhatsApp service or conversation handler
const sentimentResult = await this.langChainService.analyzeAndSaveCustomerSentiment(
  customerId,
  conversationId,
  messageIndex,
  message,
  conversationHistory,
  { source: 'whatsapp', channel: 'business' }
);

if (sentimentResult.saved) {
  console.log('Sentiment analysis saved successfully');
  console.log('Next best action:', sentimentResult.leadQualification.nextBestAction);
}
```

### 2. Get Customer Sentiment Metrics
```typescript
// Get overall metrics
const metrics = await this.customerSentimentService.getSentimentMetrics({});

console.log(`Total customers: ${metrics.totalCustomers}`);
console.log(`Positive sentiment: ${metrics.positiveSentiment}`);
console.log(`High urgency leads: ${metrics.highUrgency}`);
console.log(`Strong buying intent: ${metrics.strongBuyingIntent}`);
```

### 3. Find High-Priority Leads
```typescript
// Get customers with high urgency or strong buying intent
const highPriorityLeads = await this.customerSentimentService.getHighPriorityLeads(10);

highPriorityLeads.forEach(lead => {
  console.log(`Customer: ${lead.customer.name}`);
  console.log(`Urgency: ${lead.urgency}`);
  console.log(`Buying Intent: ${lead.buyingIntent}`);
  console.log(`Next Action: ${lead.nextBestAction}`);
});
```

## Integration with WhatsApp

The system automatically analyzes sentiment when:
1. **New messages arrive** in WhatsApp conversations
2. **Manual analysis is requested** via API
3. **Scheduled analysis** runs periodically

### Automatic Sentiment Analysis
```typescript
// In your message handler
async handleIncomingMessage(message: string, customerId: string, conversationId: string) {
  // Get conversation history
  const history = await this.getConversationHistory(conversationId);
  
  // Analyze and save sentiment
  const sentiment = await this.langChainService.analyzeAndSaveCustomerSentiment(
    customerId,
    conversationId,
    history.length + 1,
    message,
    history,
    { source: 'whatsapp' }
  );
  
  // Use sentiment data for response generation
  if (sentiment.leadQualification.urgency === 'high') {
    // Prioritize this conversation
    await this.escalateToHumanAgent(customerId, conversationId);
  }
}
```

## Sales Intelligence Dashboard

### Key Metrics to Monitor
- **Lead Quality Score**: Based on urgency + buying intent + budget
- **Conversion Probability**: Sentiment trend analysis
- **Response Time Optimization**: Urgency-based prioritization
- **Objection Handling**: Top objections and counter-strategies
- **Pain Point Analysis**: Common problems to address

### Recommended Actions
1. **High Urgency + Strong Intent**: Immediate follow-up, pricing discussion
2. **Negative Sentiment**: Escalate to human agent, address concerns
3. **High Budget + Decision Maker**: Premium service offering
4. **Multiple Objections**: Create objection-handling playbook
5. **Trending Pain Points**: Product/service improvement opportunities

## Configuration

### Environment Variables
```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=27017
DATABASE_NAME=gtower_customers
DATABASE_USER=username
DATABASE_PASS=password

# OpenAI (for sentiment analysis)
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4
OPENAI_TEMPERATURE=0.7
```

### Database Indexes
The system automatically creates optimized indexes for:
- Customer ID lookups
- Sentiment-based queries
- Urgency and buying intent filtering
- Date-based trend analysis

## Performance Considerations

### Database Optimization
- Compound indexes for common query patterns
- Efficient aggregation pipelines for metrics
- Pagination for large result sets

### Caching Strategy
- Current sentiment cached in memory
- Historical data paginated for performance
- Metrics calculated on-demand with caching

## Monitoring and Alerts

### Key Performance Indicators
- Sentiment analysis accuracy
- Database storage growth
- API response times
- Error rates in sentiment processing

### Alert Thresholds
- High negative sentiment spike (>20% increase)
- Database storage >80% capacity
- API response time >2 seconds
- Sentiment analysis failure rate >5%

## Troubleshooting

### Common Issues
1. **Sentiment Analysis Fails**: Check OpenAI API key and quota
2. **Database Connection Errors**: Verify MongoDB connection string
3. **Slow Query Performance**: Check database indexes and query patterns
4. **Memory Issues**: Monitor sentiment data storage growth

### Debug Mode
Enable detailed logging by setting log level to DEBUG:
```typescript
// In your logger configuration
this.logger.setLogLevel('debug');
```

## Future Enhancements

### Planned Features
- **Real-time Sentiment Streaming**: WebSocket updates for live dashboards
- **Advanced Analytics**: Machine learning for trend prediction
- **Integration APIs**: CRM and sales tool integrations
- **Automated Actions**: Trigger workflows based on sentiment changes
- **Multi-language Support**: Sentiment analysis in multiple languages

### API Extensions
- **Bulk Analysis**: Process multiple conversations simultaneously
- **Custom Models**: Train sentiment models on your data
- **Export Functionality**: CSV/Excel export for reporting
- **Webhook Support**: Real-time notifications for sentiment changes
