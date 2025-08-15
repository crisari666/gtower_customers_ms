import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LangChainConfig {
  constructor(private configService: ConfigService) {}

  get openaiApiKey(): string {
    return this.configService.get<string>('OPENAI_API_KEY') || '';
  }

  get openaiModel(): string {
    return this.configService.get<string>('OPENAI_MODEL') || 'gpt-3.5-turbo';
  }

  get openaiTemperature(): number {
    return this.configService.get<number>('OPENAI_TEMPERATURE') || 0.7;
  }

  get openaiMaxTokens(): number {
    return this.configService.get<number>('OPENAI_MAX_TOKENS') || 1000;
  }

  get isOpenAIConfigured(): boolean {
    return !!this.openaiApiKey;
  }

  get defaultModel(): string {
    if (this.isOpenAIConfigured) return 'openai';
    return 'rule-based';
  }
}
