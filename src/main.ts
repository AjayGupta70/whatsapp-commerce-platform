// ============================================
// Main Application Entry Point
// Framework: Fastify
// Documentation: Swagger
// ============================================

import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { AppModule } from './app.module';

// ─── Common Pipes/Filters/Interceptors ──────
import { AllExceptionsFilter, PrismaClientExceptionFilter } from './common/filters';
import { TransformInterceptor } from './common/interceptors';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { join } from 'path';

async function bootstrap() {
  // Use Fastify for high performance
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }), // Disable internal logger in favor of Pino
    { bufferLogs: true },
  );

  // app.useLogger(app.get(Logger));
  // app.useGlobalInterceptors(new LoggerErrorInterceptor());

  // Enable WebSocket support
  app.useWebSocketAdapter(new IoAdapter(app.getHttpServer()));

  // Serve static files from project root public folder
  await app.register(require('@fastify/static'), {
    root: join(process.cwd(), 'public'),
    prefix: '/',
    index: 'dashboard.html',
  });

  // Global Settings
  const apiPrefix = process.env.API_PREFIX || 'api';
  const apiVersion = process.env.API_VERSION || 'v1';
  app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`);
  app.enableCors();
  
  // File Upload Support for Fastify
  await app.register(require('@fastify/multipart'));

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global Filters & Interceptors
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new PrismaClientExceptionFilter(httpAdapter),
  );
  app.useGlobalInterceptors(
    new TransformInterceptor(),
  );

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('WhatsApp Automation API')
    .setDescription('Industry-standard AI-powered WhatsApp Commerce Platform')
    .setVersion('1.0')
    .addTag('WhatsApp')
    .addTag('Orders')
    .addTag('AI')
    .addTag('Payments')
    .addBearerAuth()
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Redirect root to dashboard page (so localhost:3000 works)
  app.getHttpAdapter().get('/', async (_req, res) => {
    res.redirect('/dashboard.html');
  });

  const port = process.env.APP_PORT || 3000;
  await app.listen(port, '0.0.0.0'); // Allow connections from all hosts (Docker/External)
  
  const startLogger = app.get(Logger);
  startLogger.log(`🚀 Application is running on: http://localhost:${port}/api/v1`);
  startLogger.log(`📜 Swagger Documentation: http://localhost:${port}/docs`);
}

bootstrap();
