# LangChain Integration Configuration

## Overview

This document explains how to configure and use the LangChain integration in your WhatsApp AI agent system.

## Environment Variables

Add the following environment variables to your `.env` file:

```bash
# WhatsApp Business API Configuration
WHATSAPP_TOKEN=your_whatsapp_business_token_here

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/gtower_customers

# OpenAI Configuration (Optional - for LangChain integration)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=1000



# Application Configuration
NODE_ENV=development
PORT=3000
```

## API Key Setup

### OpenAI Setup
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in 
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and add it to your `.env` file



## Model Configuration

### OpenAI Models
- **gpt-3.5-turbo**: Fast, cost-effective, good for most use cases
- **gpt-4**: More capable, better reasoning, higher cost
- **gpt-4-turbo**: Latest GPT-4 model with extended knowledge



## Usage Examples

### Basic AI Response Generation

```typescript
// Generate a response using the default model
const response = await langChainService.generateResponse(
  "Hello, I need help with pricing",
  [], // conversation history
  "Customer inquiry about pricing", // context
  'auto' // model selection
);
```

### Sentiment Analysis

```typescript
// Analyze customer sentiment
const sentiment = await langChainService.analyzeCustomerSentiment(
  "I'm very frustrated with the service",
  conversationHistory
);

console.log(`Sentiment: ${sentiment.sentiment}`);
console.log(`Confidence: ${sentiment.confidence}`);
console.log(`Reasoning: ${sentiment.reasoning}`);
```

### Conversation Summary

```typescript
// Generate conversation summary
const summary = await langChainService.generateConversationSummary(
  conversationHistory
);

console.log(`Summary: ${summary}`);
```

### Follow-up Suggestions

```typescript
// Generate intelligent follow-up suggestions
const suggestions = await langChainService.generateFollowUpSuggestions(
  conversationHistory,
  "Customer asking about product features"
);

suggestions.forEach(suggestion => {
  console.log(`- ${suggestion}`);
});
```

## API Endpoints

### AI Processing Endpoints

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

#### GET `/whatsapp/ai/model-status`
Get the status of configured AI models.

## Fallback Behavior

The system automatically falls back to rule-based responses when:
- AI models are not configured
- API calls fail
- Rate limits are exceeded
- Network issues occur

## Cost Management

### OpenAI Pricing (as of 2024)
- **gpt-3.5-turbo**: $0.0015 per 1K input tokens, $0.002 per 1K output tokens
- **gpt-4**: $0.03 per 1K input tokens, $0.06 per 1K output tokens



### Cost Optimization Tips
1. Use appropriate model sizes for different tasks
2. Implement conversation length limits
3. Cache common responses
4. Monitor token usage
5. Set reasonable max token limits

## Security Considerations

1. **API Key Security**
   - Never commit API keys to version control
   - Use environment variables
   - Rotate keys regularly
   - Monitor API usage for anomalies

2. **Data Privacy**
   - Customer messages are processed by third-party AI services
   - Ensure compliance with data protection regulations
   - Consider data residency requirements

3. **Rate Limiting**
   - Implement rate limiting for AI endpoints
   - Monitor API quotas
   - Handle rate limit errors gracefully

## Monitoring and Logging

The system provides comprehensive logging for:
- AI model initialization
- API call success/failure
- Response generation
- Error handling
- Cost tracking

## Troubleshooting

### Common Issues

1. **Model Not Initialized**
   - Check API key configuration
   - Verify environment variables
   - Check network connectivity

2. **API Rate Limits**
   - Implement exponential backoff
   - Use multiple API keys
   - Monitor usage patterns

3. **Response Quality Issues**
   - Adjust temperature settings
   - Improve system prompts
   - Use more recent models

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
LOG_LEVEL=debug
```

## Performance Optimization

1. **Response Caching**
   - Cache common responses
   - Implement conversation context caching
   - Use Redis for distributed caching

2. **Async Processing**
   - Process AI responses asynchronously
   - Implement response queuing
   - Use worker threads for heavy processing

3. **Model Selection**
   - Use faster models for simple queries
   - Reserve powerful models for complex tasks
   - Implement model fallback chains

## Future Enhancements

1. **Vector Database Integration**
   - Store conversation embeddings
   - Implement semantic search
   - Build knowledge bases

2. **Multi-modal Support**
   - Image analysis
   - Document processing
   - Voice message transcription

3. **Advanced Prompting**
   - Dynamic prompt generation
   - Context-aware prompting
   - A/B testing for prompts

4. **Custom Model Training**
   - Fine-tune models on your data
   - Domain-specific training
   - Continuous learning
