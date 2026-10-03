import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ApiErrorResponse } from 'api-contracts';
import { StructuredLogger } from './structured-logger';
import { RegistrationVerificationException } from '../auth/registration-verification.exception';

const codes: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  429: 'TOO_MANY_REQUESTS',
  503: 'SERVICE_UNAVAILABLE',
};

@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  constructor(private readonly logger: StructuredLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const parserStatus =
      exception !== null && typeof exception === 'object' && 'type' in exception
        ? exception.type === 'entity.too.large'
          ? 413
          : exception.type === 'entity.parse.failed'
            ? 400
            : undefined
        : undefined;
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : (parserStatus ?? HttpStatus.INTERNAL_SERVER_ERROR);
    const requestId = response.getHeader('x-request-id') as string;
    // Only known, safe transport text is public; never pass through exception messages.
    const message =
      status >= 500
        ? status === 503
          ? 'Service unavailable'
          : 'Internal server error'
        : ({
            400: 'Invalid request',
            401: 'Authentication required',
            403: 'Access denied',
            404: 'Resource not found',
            409: 'Request conflicts with existing data',
            413: 'Request too large',
            429: 'Too many requests',
          }[status] ?? 'Request failed');
    const body: ApiErrorResponse = {
      error: {
        code:
          (exception instanceof RegistrationVerificationException
            ? 'REGISTRATION_VERIFICATION_UNAVAILABLE'
            : codes[status]) ??
          (status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED'),
        message,
        requestId,
      },
    };
    this.logger.event(status >= 500 ? 'error' : 'warn', {
      event: 'http.error',
      requestId,
      statusCode: status,
      method: request.method,
    });
    response.status(status).json(body);
  }
}
