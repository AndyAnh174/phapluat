import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Trust proxy (for reverse proxy setup)
  const httpAdapter = app.getHttpAdapter();
  if (httpAdapter.getType() === 'express') {
    httpAdapter.getInstance().set('trust proxy', true);
  }

  // Security headers
  app.use(helmet());

  // CORS
  const corsOrigin = configService
    .get<string>('CORS_ORIGIN')
    ?.split(',')
    .map((origin) => origin.trim()) || ['http://localhost:3000'];

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter(configService));

  // Set global prefix for API routes (only in production with reverse proxy)
  // In development, routes don't have /api prefix
  // In production with reverse proxy, all routes should have /api prefix
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
  if (nodeEnv === 'production') {
    app.setGlobalPrefix('api');
  }

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('HCMUTE Exam System API')
    .setDescription('API documentation for HCMUTE Exam System')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = configService.get<string>('PORT') || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api`);
}
bootstrap();
