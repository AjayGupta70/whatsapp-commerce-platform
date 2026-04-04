// ============================================
// Global HTTP Exception Filter
// Catches all exceptions and returns standardized error responses
// ============================================

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorResponse = {
      success: false,
      statusCode: status,
      message: typeof message === 'string' ? message : (message as any)?.message || message,
      timestamp: new Date().toISOString(),
    };

    this.logger.error(
      `[${status}] ${JSON.stringify(errorResponse.message)}`,
      exception instanceof Error ? exception.stack : '',
    );

    response.status(status).send(errorResponse);
  }
}
