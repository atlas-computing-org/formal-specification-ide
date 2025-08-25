import { config } from 'dotenv';

// Load environment variables from .env file
config();

interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  CLIENT_PORT: number;
  ANTHROPIC_API_KEY: string;
  OPENAI_API_KEY?: string;
  DEEPSEEK_API_KEY?: string;
  LOG_LEVEL: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  AI_RATE_LIMIT_MAX_REQUESTS: number;
  MAX_FILE_SIZE_BYTES: number;
}

function getRequiredEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getOptionalEnvVar(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

function getEnvVarAsNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) {
    return defaultValue;
  }
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    console.warn(`Invalid number for environment variable ${key}: ${value}, using default: ${defaultValue}`);
    return defaultValue;
  }
  return num;
}

export const env: EnvironmentConfig = {
  NODE_ENV: getOptionalEnvVar('NODE_ENV', 'development'),
  PORT: getEnvVarAsNumber('PORT', 3001),
  CLIENT_PORT: getEnvVarAsNumber('CLIENT_PORT', 3000),
  ANTHROPIC_API_KEY: getRequiredEnvVar('ANTHROPIC_API_KEY'),
  OPENAI_API_KEY: getOptionalEnvVar('OPENAI_API_KEY', ''),
  DEEPSEEK_API_KEY: getOptionalEnvVar('DEEPSEEK_API_KEY', ''),
  LOG_LEVEL: getOptionalEnvVar('LOG_LEVEL', 'info'),
  RATE_LIMIT_WINDOW_MS: getEnvVarAsNumber('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: getEnvVarAsNumber('RATE_LIMIT_MAX_REQUESTS', 100),
  AI_RATE_LIMIT_MAX_REQUESTS: getEnvVarAsNumber('AI_RATE_LIMIT_MAX_REQUESTS', 20),
  MAX_FILE_SIZE_BYTES: getEnvVarAsNumber('MAX_FILE_SIZE_BYTES', 1000000), // 1MB
};

// Validate environment configuration
export function validateEnvironment(): void {
  if (env.NODE_ENV === 'production') {
    // Additional production checks
    if (!env.ANTHROPIC_API_KEY || env.ANTHROPIC_API_KEY.length < 10) {
      throw new Error('Invalid ANTHROPIC_API_KEY for production environment');
    }
  }
  
  console.log('Environment configuration validated successfully');
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`Port: ${env.PORT}`);
  console.log(`Client Port: ${env.CLIENT_PORT}`);
  console.log(`Log Level: ${env.LOG_LEVEL}`);
}
