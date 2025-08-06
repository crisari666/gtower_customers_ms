import { Injectable } from '@nestjs/common';
import { AppConfigService } from './config/config.service';

@Injectable()
export class AppService {
  constructor(private readonly appConfigService: AppConfigService) {}

  getHello(): string {
    return `Hello World! Running in ${this.appConfigService.nodeEnv} mode on port ${this.appConfigService.port}`;
  }

  getConfigInfo(): object {
    return {
      nodeEnv: this.appConfigService.nodeEnv,
      port: this.appConfigService.port,
      apiPrefix: this.appConfigService.apiPrefix,
      apiVersion: this.appConfigService.apiVersion,
      logLevel: this.appConfigService.logLevel,
      isDevelopment: this.appConfigService.isDevelopment,
      isProduction: this.appConfigService.isProduction,
    };
  }
}
