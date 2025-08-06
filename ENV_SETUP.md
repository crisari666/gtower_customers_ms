# Environment Variables Setup

This NestJS application is configured to use environment variables through the `@nestjs/config` package.

## Setup

1. **Install Dependencies**: The required packages have been installed:
   - `@nestjs/config`: NestJS configuration module
   - `dotenv`: Environment variable loader

2. **Create .env File**: Create a `.env` file in the root directory with the following structure:

```env
# Application Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# API Configuration
API_PREFIX=api
API_VERSION=v1

# Security
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=1d

# External Services
ELEVENLABS_API_KEY=your-elevenlabs-api-key
ELEVENLABS_AGENT_ID=your-elevenlabs-agent-id

# Logging
LOG_LEVEL=debug
```

## Configuration Structure

The application uses a typed configuration system with the following structure:

- **Application**: Port, Node environment
- **Database**: Connection URL
- **API**: Prefix and version
- **Security**: JWT configuration
- **External Services**: ElevenLabs integration
- **Logging**: Log level configuration

## Usage

### In Services

```typescript
import { Injectable } from '@nestjs/common';
import { AppConfigService } from './config/config.service';

@Injectable()
export class MyService {
  constructor(private readonly configService: AppConfigService) {}

  someMethod(): void {
    const port = this.configService.port;
    const isDev = this.configService.isDevelopment;
    const apiKey = this.configService.elevenLabsApiKey;
  }
}
```

### In Controllers

```typescript
import { Controller, Get } from '@nestjs/common';
import { AppConfigService } from './config/config.service';

@Controller()
export class MyController {
  constructor(private readonly configService: AppConfigService) {}

  @Get('config')
  getConfig(): object {
    return {
      port: this.configService.port,
      nodeEnv: this.configService.nodeEnv,
      apiPrefix: this.configService.apiPrefix,
    };
  }
}
```

## Available Endpoints

- `GET /api/`: Returns hello message with environment info
- `GET /api/config`: Returns current configuration values

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Application port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `DATABASE_URL` | Database connection string | `postgresql://...` |
| `API_PREFIX` | API route prefix | `api` |
| `API_VERSION` | API version | `v1` |
| `JWT_SECRET` | JWT signing secret | `your-super-secret-jwt-key` |
| `JWT_EXPIRES_IN` | JWT expiration time | `1d` |
| `ELEVENLABS_API_KEY` | ElevenLabs API key | `''` |
| `ELEVENLABS_AGENT_ID` | ElevenLabs agent ID | `''` |
| `LOG_LEVEL` | Logging level | `debug` |

## Security Notes

- Never commit the `.env` file to version control
- Use strong, unique values for secrets in production
- Consider using a secrets management service for production environments 