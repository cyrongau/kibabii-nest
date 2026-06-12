import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

function redactSensitive(body: any): any {
  if (!body || typeof body !== 'object') return body;
  const sensitiveKeys = ['password', 'token', 'accessToken', 'idToken', 'secret', 'code', 'pin', 'key'];
  
  if (Array.isArray(body)) {
    return body.map(item => redactSensitive(item));
  }

  const copy = { ...body };
  for (const key of Object.keys(copy)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      copy[key] = '[REDACTED]';
    } else if (typeof copy[key] === 'object' && copy[key] !== null) {
      copy[key] = redactSensitive(copy[key]);
    }
  }
  return copy;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    }

    const user = (request as any).user;
    const logPayload = {
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url,
      status,
      ip: request.ip || request.headers['x-forwarded-for'] || request.socket.remoteAddress,
      userAgent: request.headers['user-agent'],
      userId: user?.id || user?.sub || 'anonymous',
      userEmail: user?.email || 'anonymous',
      body: redactSensitive(request.body),
      query: redactSensitive(request.query),
      params: redactSensitive(request.params),
      error: exception instanceof Error ? {
        name: exception.name,
        message: exception.message,
        stack: exception.stack,
      } : exception,
    };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`💥 Internal Exception Context: ${JSON.stringify(logPayload, null, 2)}`);
    } else {
      this.logger.warn(`⚠️ Warning Exception Context: ${JSON.stringify(logPayload, null, 2)}`);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: typeof message === 'string' ? message : message.message || message,
    });
  }
}
