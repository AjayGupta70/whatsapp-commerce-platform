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
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
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

  app.useLogger(app.get(Logger));
  app.useGlobalInterceptors(new LoggerErrorInterceptor());

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

  // Raw Body Support for Webhooks (Razorpay)
  await app.register(require('fastify-raw-body'), {
    field: 'rawBody', // req.rawBody
    global: true,
    encoding: 'utf8',
    runFirst: true,
  });

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

  // Start RabbitMQ Microservice Consumer
  const rmqUrl = process.env.RABBITMQ_URL || 'amqp://admin:password@rabbitmq:5672';
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rmqUrl],
      queue: 'whatsapp_queue',
      queueOptions: {
        durable: true,
      },
      noAck: false, // Ensure manual or framework auto-ack
    },
  });
  await app.startAllMicroservices();
  
  const startLogger = app.get(Logger);
  startLogger.log(`🚀 Application is running on: http://localhost:${port}/api/v1`);
  startLogger.log(`📜 Swagger Documentation: http://localhost:${port}/docs`);
  startLogger.log(`🐇 RabbitMQ Microservices connected`);
}

bootstrap();
