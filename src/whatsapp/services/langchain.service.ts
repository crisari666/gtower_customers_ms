import { Injectable, Logger } from '@nestjs/common';
import { LangChainConfig } from '../config/langchain.config';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { ConfigFileUtils } from '../../utils/config-file.utils';

@Injectable()
export class LangChainService {
  private readonly logger = new Logger(LangChainService.name);
  private openaiModel: ChatOpenAI | null = null;

  constructor(private readonly langChainConfig: LangChainConfig) {
    this.initializeModels();
  }

  private initializeModels(): void {
    try {      
      if (this.langChainConfig.isOpenAIConfigured) {
        this.openaiModel = new ChatOpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          modelName: process.env.OPENAI_MODEL,
          temperature: Number(process.env.OPENAI_TEMPERATURE),
          maxTokens: 1000,
        });
        this.logger.log('OpenAI model initialized successfully');
      }
    } catch (error) {
      this.logger.error('Error initializing LangChain models:', error);
    }
  }

  async generateResponse(
    message: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    context?: string,
    modelType?: 'openai' | 'auto'
  ): Promise<string> {
    try {
      const selectedModel = this.selectModel(modelType);      
      if (!selectedModel) {
        return this.generateRuleBasedResponse(message);
      }

      const response = await this.generateAIModelResponse(
        message,
        conversationHistory,
        context,
        selectedModel
      );

      return response;
    } catch (error) {
      this.logger.error('Error generating AI response:', error);
      return this.generateRuleBasedResponse(message);
    }
  }

  private selectModel(modelType?: 'openai' | 'auto'): ChatOpenAI | null {
    if (modelType === 'openai' && this.openaiModel) {
      return this.openaiModel;
    }

    // Auto selection based on availability
    if (modelType === 'auto' || !modelType) {
      if (this.openaiModel) return this.openaiModel;
    }

    return null;
  }

  private async generateAIModelResponse(
    message: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    context: string | undefined,
    model: ChatOpenAI
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context);
    const messages = this.buildMessageChain(systemPrompt, conversationHistory, message);

    const response = await model.invoke(messages);
    return response.content as string;
  }

  private buildSystemPrompt(context?: string): string {
    const defaultPrompt = `You are an intelligent sales agent specializing in selling real estate lots. Your primary objective is to interact with customers to offer and sell parcels of land. Each lot available is 500 square meters, priced at 70,000,000 pesos.`;
    
    try {
      const promptsData = ConfigFileUtils.readConfigFile(
        '../config/system-prompts.json',
        'src/whatsapp/config/system-prompts.json'
      );
      
      let basePrompt = promptsData.sales_agent.base;
      
      if (context) {
        basePrompt = `${basePrompt}\n\nContext: ${context}`;
      }
      
      return basePrompt;
    } catch (error) {
      this.logger.error('Failed to read system prompts, using default:', error);
      return defaultPrompt;
    }
  }

  private buildMessageChain(
    systemPrompt: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    currentMessage: string
  ): (SystemMessage | HumanMessage | AIMessage)[] {
    const messages: (SystemMessage | HumanMessage | AIMessage)[] = [
      new SystemMessage(systemPrompt)
    ];

    // Add conversation history
    for (const msg of conversationHistory) {
      if (msg.role === 'user') {
        messages.push(new HumanMessage(msg.content));
      } else if (msg.role === 'assistant') {
        messages.push(new AIMessage(msg.content));
      }
    }

    // Add current message
    messages.push(new HumanMessage(currentMessage));

    return messages;
  }

  private generateRuleBasedResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return 'Hello! Thank you for reaching out. How can I assist you today?';
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      return 'I\'m here to help! What specific assistance do you need?';
    }
    
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('quote')) {
      return 'I\'d be happy to help you with pricing information. Could you provide more details about what you\'re looking for?';
    }
    
    if (lowerMessage.includes('schedule') || lowerMessage.includes('appointment') || lowerMessage.includes('booking')) {
      return 'To schedule an appointment, please let me know your preferred date and time, and I\'ll check our availability.';
    }
    
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return 'You\'re welcome! Is there anything else I can help you with?';
    }
    
    if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
      return 'Thank you for chatting with us! Have a great day. If you need anything else, feel free to reach out.';
    }
    
    return 'Thank you for your message. I\'m processing your request and will get back to you shortly. If this is urgent, please contact our support team directly.';
  }

  async generateConversationSummary(
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<string> {
    try {
      if (!this.openaiModel) {
        return 'Conversation summary not available - OpenAI model not configured.';
      }

      const model = this.selectModel();
      if (!model) {
        return 'Conversation summary not available - OpenAI model not configured.';
      }

      const summaryPrompt = `Please provide a brief summary of this customer conversation in 2-3 sentences, highlighting the main topics discussed and any action items needed.`;

      const messages = [
        new SystemMessage(summaryPrompt),
        new HumanMessage(`Conversation:\n${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`)
      ];

      const response = await model.invoke(messages);
      return response.content as string;
    } catch (error) {
      this.logger.error('Error generating conversation summary:', error);
      return 'Unable to generate conversation summary at this time.';
    }
  }

  async analyzeCustomerSentiment(
    message: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<{ sentiment: 'positive' | 'negative' | 'neutral'; confidence: number; reasoning: string }> {
    try {
      if (!this.openaiModel) {
        return {
          sentiment: 'neutral',
          confidence: 0.5,
          reasoning: 'OpenAI model not configured for sentiment analysis'
        };
      }

      const model = this.selectModel();
      if (!model) {
        return {
          sentiment: 'neutral',
          confidence: 0.5,
          reasoning: 'OpenAI model not configured for sentiment analysis'
        };
      }

      const sentimentPrompt = `Analyze the customer's sentiment in this message and conversation context. 
Return a JSON response with:
- sentiment: "positive", "negative", or "neutral"
- confidence: a number between 0 and 1
- reasoning: a brief explanation of your analysis

Focus on the emotional tone and customer satisfaction indicators.`;

      const messages = [
        new SystemMessage(sentimentPrompt),
        new HumanMessage(`Conversation context:\n${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n\nCurrent message: ${message}`)
      ];

      const response = await model.invoke(messages);
      const content = response.content as string;
      
      try {
        const parsed = JSON.parse(content);
        return {
          sentiment: parsed.sentiment || 'neutral',
          confidence: parsed.confidence || 0.5,
          reasoning: parsed.reasoning || 'Analysis completed'
        };
      } catch (parseError) {
        this.logger.warn('Failed to parse sentiment analysis response:', parseError);
        return {
          sentiment: 'neutral',
          confidence: 0.5,
          reasoning: 'Unable to parse sentiment analysis'
        };
      }
    } catch (error) {
      this.logger.error('Error analyzing customer sentiment:', error);
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        reasoning: 'Error occurred during sentiment analysis'
      };
    }
  }

  async generateFollowUpSuggestions(
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    context?: string
  ): Promise<string[]> {
    try {
      if (!this.openaiModel) {
        return [
          'Thank you for your inquiry. Is there anything else I can help you with?',
          'Would you like me to connect you with a human agent for further assistance?'
        ];
      }

      const model = this.selectModel();
      if (!model) {
        return [
          'Thank you for your inquiry. Is there anything else I can help you with?',
          'Would you like me to connect you with a human agent for further assistance?'
        ];
      }

      const followUpPrompt = `Based on this conversation, suggest 3-5 helpful follow-up questions or statements that would be appropriate for the AI agent to ask the customer. 
Focus on being helpful and moving the conversation forward constructively.

Return only the suggestions, one per line, without numbering or bullet points.`;

      const messages = [
        new SystemMessage(followUpPrompt),
        new HumanMessage(`Conversation:\n${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n\nContext: ${context || 'No additional context'}`)
      ];

      const response = await model.invoke(messages);
      const content = response.content as string;
      
      return content.split('\n').filter(line => line.trim().length > 0).slice(0, 5);
    } catch (error) {
      this.logger.error('Error generating follow-up suggestions:', error);
      return [
        'Thank you for your inquiry. Is there anything else I can help you with?',
        'Would you like me to connect you with a human agent for further assistance?'
      ];
    }
  }

  getModelStatus(): { openai: boolean; default: string } {
    return {
      openai: this.langChainConfig.isOpenAIConfigured,
      default: this.langChainConfig.defaultModel
    };
  }
}
