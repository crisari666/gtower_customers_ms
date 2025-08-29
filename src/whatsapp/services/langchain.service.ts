import { Injectable, Logger } from '@nestjs/common';
import { LangChainConfig } from '../config/langchain.config';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { ConfigFileUtils } from '../../utils/config-file.utils';
import { CustomerSentimentService } from '../../sentiment/services/customer-sentiment.service';

@Injectable()
export class LangChainService {
  private readonly logger = new Logger(LangChainService.name);
  private openaiModel: ChatOpenAI | null = null;

  constructor(
    private readonly langChainConfig: LangChainConfig,
    private readonly customerSentimentService: CustomerSentimentService
  ) {
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
  ): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    reasoning: string;
    leadQualification: {
      urgency: 'high' | 'medium' | 'low';
      buyingIntent: 'strong' | 'moderate' | 'weak' | 'none';
      budgetIndication: 'high' | 'medium' | 'low' | 'unknown';
      decisionMaker: boolean;
      timeline: 'immediate' | 'short_term' | 'long_term' | 'unknown';
      painPoints: string[];
      objections: string[];
      positiveSignals: string[];
      riskFactors: string[];
      nextBestAction: string;
    };
    customerProfile: {
      expertise: 'beginner' | 'intermediate' | 'expert';
      industry: string;
      companySize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise' | 'unknown';
      role: string;
      communicationStyle: 'formal' | 'casual' | 'technical' | 'business';
    };
  }> {
    try {
      if (!this.openaiModel) {
        return this.getDefaultResponse();
      }

      const model = this.selectModel();
      if (!model) {
        return this.getDefaultResponse();
      }

      const comprehensivePrompt = `Analyze this customer interaction for comprehensive lead qualification and sales intelligence.

Return a detailed JSON response with the following structure:

LEAD QUALIFICATION:
- sentiment: "positive", "negative", or "neutral" (based on the customer's sentiment)
- confidence: number between 0 and 1 (based on the confidence in the sentiment)
- urgency: "high", "medium", or "low" (based on time-sensitive language, deadlines, immediate needs)
- buyingIntent: "strong", "moderate", "weak", or "none" (based on purchase language, questions about pricing, features)
- budgetIndication: "high", "medium", "low", or "unknown" (based on company size, role, spending language)
- decisionMaker: true/false (based on authority indicators, decision-making language)
- timeline: "immediate", "short_term", "long_term", or "unknown" (based on urgency and planning language)
- painPoints: array of specific problems or challenges mentioned
- objections: array of concerns, hesitations, or barriers mentioned
- positiveSignals: array of positive indicators (interest, satisfaction, agreement)
- riskFactors: array of potential issues or red flags
- nextBestAction: specific recommendation for next sales step

CUSTOMER PROFILE:
- expertise: "beginner", "intermediate", or "expert" (based on technical knowledge level)
- industry: detected industry or business domain
- companySize: "startup", "small", "medium", "large", "enterprise", or "unknown"
- role: detected job title or role
- communicationStyle: "formal", "casual", "technical", or "business"

Focus on sales-relevant indicators, buying signals, and actionable insights for lead qualification.`;

      const messages = [
        new SystemMessage(comprehensivePrompt),
        new HumanMessage(`Conversation context:\n${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n\nCurrent message: ${message}`)
      ];

      const response = await model.invoke(messages);
      const content = response.content as string;
      
      try {
        const parsed = JSON.parse(content);
        return {
          sentiment: parsed.sentiment || 'neutral',
          confidence: parsed.confidence || 0.5,
          reasoning: parsed.reasoning || 'Analysis completed',
          leadQualification: {
            urgency: parsed.leadQualification?.urgency || 'low',
            buyingIntent: parsed.leadQualification?.buyingIntent || 'none',
            budgetIndication: parsed.leadQualification?.budgetIndication || 'unknown',
            decisionMaker: parsed.leadQualification?.decisionMaker || false,
            timeline: parsed.leadQualification?.timeline || 'unknown',
            painPoints: parsed.leadQualification?.painPoints || [],
            objections: parsed.leadQualification?.objections || [],
            positiveSignals: parsed.leadQualification?.positiveSignals || [],
            riskFactors: parsed.leadQualification?.riskFactors || [],
            nextBestAction: parsed.leadQualification?.nextBestAction || 'Continue conversation to gather more information'
          },
          customerProfile: {
            expertise: parsed.customerProfile?.expertise || 'beginner',
            industry: parsed.customerProfile?.industry || 'unknown',
            companySize: parsed.customerProfile?.companySize || 'unknown',
            role: parsed.customerProfile?.role || 'unknown',
            communicationStyle: parsed.customerProfile?.communicationStyle || 'casual'
          }
        };
      } catch (parseError) {
        this.logger.warn('Failed to parse comprehensive lead analysis response:', parseError);
        return this.getDefaultResponse();
      }
    } catch (error) {
      this.logger.error('Error analyzing customer sentiment and lead qualification:', error);
      return this.getDefaultResponse();
    }
  }

  async analyzeAndSaveCustomerSentiment(
    customerId: string,
    conversationId: string,
    messageIndex: number,
    message: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    conversationContext?: Record<string, any>
  ): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    reasoning: string;
    leadQualification: {
      urgency: 'high' | 'medium' | 'low';
      buyingIntent: 'strong' | 'moderate' | 'weak' | 'none';
      budgetIndication: 'high' | 'medium' | 'low' | 'unknown';
      decisionMaker: boolean;
      timeline: 'immediate' | 'short_term' | 'long_term' | 'unknown';
      painPoints: string[];
      objections: string[];
      positiveSignals: string[];
      riskFactors: string[];
      nextBestAction: string;
    };
    customerProfile: {
      expertise: 'beginner' | 'intermediate' | 'expert';
      industry: string;
      companySize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise' | 'unknown';
      role: string;
      communicationStyle: 'formal' | 'casual' | 'technical' | 'business';
    };
    saved: boolean;
  }> {
    try {
      // Analyze sentiment
      const analysisResult = await this.analyzeCustomerSentiment(message, conversationHistory);
      
      // Transform the data to match the DTO structure
      const sentimentData = {
        sentiment: analysisResult.sentiment,
        confidence: analysisResult.confidence,
        reasoning: analysisResult.reasoning,
        urgency: analysisResult.leadQualification.urgency,
        buyingIntent: analysisResult.leadQualification.buyingIntent,
        budgetIndication: analysisResult.leadQualification.budgetIndication,
        decisionMaker: analysisResult.leadQualification.decisionMaker,
        timeline: analysisResult.leadQualification.timeline,
        painPoints: analysisResult.leadQualification.painPoints,
        objections: analysisResult.leadQualification.objections,
        positiveSignals: analysisResult.leadQualification.positiveSignals,
        riskFactors: analysisResult.leadQualification.riskFactors,
        nextBestAction: analysisResult.leadQualification.nextBestAction,
        expertise: analysisResult.customerProfile.expertise,
        industry: analysisResult.customerProfile.industry,
        companySize: analysisResult.customerProfile.companySize,
        role: analysisResult.customerProfile.role,
        communicationStyle: analysisResult.customerProfile.communicationStyle
      };

      // Save to database
      try {
        await this.customerSentimentService.saveSentimentAnalysis(
          customerId,
          conversationId,
          messageIndex,
          message,
          sentimentData,
          conversationContext
        );
        
        this.logger.log(`Sentiment analysis saved for customer ${customerId}, conversation ${conversationId}`);
        
        return {
          ...analysisResult,
          saved: true
        };
      } catch (saveError) {
        this.logger.error(`Error saving sentiment analysis for customer ${customerId}:`, saveError);
        
        return {
          ...analysisResult,
          saved: false
        };
      }
    } catch (error) {
      this.logger.error(`Error in analyzeAndSaveCustomerSentiment for customer ${customerId}:`, error);
      
      const defaultResult = this.getDefaultResponse();
      return {
        ...defaultResult,
        saved: false
      };
    }
  }

  private getDefaultResponse() {
    return {
      sentiment: 'neutral' as const,
      confidence: 0.5,
      reasoning: 'Analysis unavailable',
      leadQualification: {
        urgency: 'low' as const,
        buyingIntent: 'none' as const,
        budgetIndication: 'unknown' as const,
        decisionMaker: false,
        timeline: 'unknown' as const,
        painPoints: [],
        objections: [],
        positiveSignals: [],
        riskFactors: [],
        nextBestAction: 'Continue conversation to gather more information'
      },
      customerProfile: {
        expertise: 'beginner' as const,
        industry: 'unknown',
        companySize: 'unknown' as const,
        role: 'unknown',
        communicationStyle: 'casual' as const
      }
    };
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
