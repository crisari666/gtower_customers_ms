import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LangChainService } from './langchain.service';
import { LangChainConfig } from '../config/langchain.config';

describe('LangChainService', () => {
  let service: LangChainService;
  let langChainConfig: LangChainConfig;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LangChainService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        LangChainConfig,
      ],
    }).compile();

    service = module.get<LangChainService>(LangChainService);
    langChainConfig = module.get<LangChainConfig>(LangChainConfig);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateResponse', () => {
    it('should generate rule-based response when no AI models are configured', async () => {
      // Mock no AI models configured
      jest.spyOn(service as any, 'selectModel').mockReturnValue(null);

      const response = await service.generateResponse('Hello there!');
      
      expect(response).toContain('Hello! Thank you for reaching out');
    });

    it('should handle errors gracefully and fall back to rule-based responses', async () => {
      // Mock AI model that throws error
      const mockModel = {
        invoke: jest.fn().mockRejectedValue(new Error('API Error')),
      };
      
      jest.spyOn(service as any, 'selectModel').mockReturnValue(mockModel);

      const response = await service.generateResponse('Hello there!');
      
      expect(response).toContain('Hello! Thank you for reaching out');
    });
  });

  describe('generateConversationSummary', () => {
    it('should return fallback message when no AI models are configured', async () => {
      jest.spyOn(service as any, 'selectModel').mockReturnValue(null);

      const summary = await service.generateConversationSummary([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ]);

      expect(summary).toContain('Conversation summary not available');
    });
  });

  describe('analyzeCustomerSentiment', () => {
    it('should return neutral sentiment when no AI models are configured', async () => {
      jest.spyOn(service as any, 'selectModel').mockReturnValue(null);

      const sentiment = await service.analyzeCustomerSentiment('Hello there!');

      expect(sentiment.sentiment).toBe('neutral');
      expect(sentiment.confidence).toBe(0.5);
      expect(sentiment.reasoning).toContain('AI models not configured');
    });
  });

  describe('generateFollowUpSuggestions', () => {
    it('should return default suggestions when no AI models are configured', async () => {
      jest.spyOn(service as any, 'selectModel').mockReturnValue(null);

      const suggestions = await service.generateFollowUpSuggestions([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ]);

      expect(suggestions).toHaveLength(2);
      expect(suggestions[0]).toContain('Thank you for your inquiry');
      expect(suggestions[1]).toContain('connect you with a human agent');
    });
  });

  describe('getModelStatus', () => {
    it('should return model status information', () => {
      const status = service.getModelStatus();
      
      expect(status).toHaveProperty('openai');
      expect(status).toHaveProperty('default');
    });
  });

  describe('rule-based responses', () => {
    it('should handle greetings correctly', async () => {
      jest.spyOn(service as any, 'selectModel').mockReturnValue(null);

      const response = await service.generateResponse('Hello!');
      expect(response).toContain('Hello! Thank you for reaching out');
    });

    it('should handle help requests correctly', async () => {
      jest.spyOn(service as any, 'selectModel').mockReturnValue(null);

      const response = await service.generateResponse('I need help');
      expect(response).toContain('I\'m here to help!');
    });

    it('should handle pricing inquiries correctly', async () => {
      jest.spyOn(service as any, 'selectModel').mockReturnValue(null);

      const response = await service.generateResponse('What are your prices?');
      expect(response).toContain('pricing information');
    });

    it('should handle appointment requests correctly', async () => {
      jest.spyOn(service as any, 'selectModel').mockReturnValue(null);

      const response = await service.generateResponse('I want to schedule an appointment');
      expect(response).toContain('schedule an appointment');
    });

    it('should handle thank you messages correctly', async () => {
      jest.spyOn(service as any, 'selectModel').mockReturnValue(null);

      const response = await service.generateResponse('Thank you so much!');
      expect(response).toContain('You\'re welcome!');
    });

    it('should handle goodbye messages correctly', async () => {
      jest.spyOn(service as any, 'selectModel').mockReturnValue(null);

      const response = await service.generateResponse('Goodbye!');
      expect(response).toContain('Thank you for chatting with us!');
    });

    it('should provide default response for unrecognized messages', async () => {
      jest.spyOn(service as any, 'selectModel').mockReturnValue(null);

      const response = await service.generateResponse('Random message here');
      expect(response).toContain('Thank you for your message');
    });
  });
});
