import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
    }),
  );

  const allowedOrigins =
    nodeEnv === 'production'
      ? [configService.get<string>('FRONTEND_URL', 'https://claritydocs.com')]
      : [
          'http://localhost:5173',
          'http://localhost:3000',
          'http://localhost:80',
        ];

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle(configService.get<string>('SWAGGER_TITLE', 'ClarityDocs API'))
      .setDescription(
        configService.get<string>(
          'SWAGGER_DESCRIPTION',
          'AI-powered document intelligence platform',
        ),
      )
      .setVersion(configService.get<string>('SWAGGER_VERSION', '1.0'))
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('documents', 'Document processing endpoints')
      .addTag('health', 'Health check endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    logger.log(`Swagger docs at http://localhost:${port}/api/docs`);
  }

  await app.listen(port);
  logger.log(`ClarityDocs API running on http://localhost:${port}`);
  logger.log(`Environment: ${nodeEnv}`);
}

void bootstrap();
