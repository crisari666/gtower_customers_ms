import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from './configuration';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService<AppConfig, true>) {}

  get port(): number {
    return this.configService.get<number>('port', { infer: true });
  }

  get nodeEnv(): string {
    return this.configService.get<string>('nodeEnv', { infer: true });
  }

  get databaseUrl(): string {
    return this.configService.get<string>('database.url', { infer: true });
  }

  get apiPrefix(): string {
    return this.configService.get<string>('api.prefix', { infer: true });
  }

  get apiVersion(): string {
    return this.configService.get<string>('api.version', { infer: true });
  }

  get jwtSecret(): string {
    return this.configService.get<string>('security.jwtSecret', { infer: true });
  }

  get jwtExpiresIn(): string {
    return this.configService.get<string>('security.jwtExpiresIn', { infer: true });
  }

  get hashKey(): string {
    return this.configService.get<string>('security.hashKey', { infer: true });
  }

  get elevenLabsApiKey(): string {
    return this.configService.get<string>('externalServices.elevenLabsApiKey', { infer: true });
  }

  get elevenLabsAgentId(): string {
    return this.configService.get<string>('externalServices.elevenLabsAgentId', { infer: true });
  }

  get logLevel(): string {
    return this.configService.get<string>('logging.level', { infer: true });
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }
} 