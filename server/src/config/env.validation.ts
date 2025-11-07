import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateIf,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsString()
  @IsOptional()
  PORT: string = '3000';

  // Admin Authentication
  @IsString()
  @IsNotEmpty()
  ADMIN_USERNAME: string;

  @ValidateIf((o) => !o.ADMIN_PASSWORD_HASH)
  @IsString()
  @IsNotEmpty()
  ADMIN_PASSWORD?: string;

  @ValidateIf((o) => !o.ADMIN_PASSWORD)
  @IsString()
  @IsNotEmpty()
  ADMIN_PASSWORD_HASH?: string;

  // JWT
  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '1h';

  // Google OAuth
  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_ID?: string;

  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_SECRET?: string;

  @IsString()
  @IsOptional()
  GOOGLE_CALLBACK_URL?: string;

  // MongoDB
  @IsString()
  @IsNotEmpty()
  MONGODB_URI: string;

  // CORS
  @IsString()
  @IsOptional()
  CORS_ORIGIN: string = 'http://localhost:3000';

  // Frontend URL (for OAuth redirect)
  @IsString()
  @IsOptional()
  FRONTEND_URL: string = 'http://localhost:3001';
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}

