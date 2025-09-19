export interface DatabaseConfig {
  url: string;
}

export interface ApiConfig {
  prefix: string;
  version: string;
}

export interface SecurityConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  hashKey: string;
}

export interface ExternalServicesConfig {
  elevenLabsApiKey: string;
  elevenLabsAgentId: string;
}

export interface LoggingConfig {
  level: string;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  database: DatabaseConfig;
  api: ApiConfig;
  security: SecurityConfig;
  externalServices: ExternalServicesConfig;
  logging: LoggingConfig;
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/database_name',
  },
  api: {
    prefix: process.env.API_PREFIX || 'api',
    version: process.env.API_VERSION || 'v1',
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
    hashKey: process.env.HASH_KEY || 'your-default-hash-key',
  },
  externalServices: {
    elevenLabsApiKey: process.env.ELEVENLABS_API_KEY || '',
    elevenLabsAgentId: process.env.ELEVENLABS_AGENT_ID || '',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },
}); 