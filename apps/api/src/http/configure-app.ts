import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Request, Response, NextFunction } from 'express';
import { json } from 'express';
import { API_PREFIX } from 'api-contracts';
import type { ApiEnvironment } from '../config/environment';
import { ApiErrorFilter } from './error.filter';
import { StructuredLogger } from './structured-logger';

export function configureApp(
  app: INestApplication,
  environment: ApiEnvironment,
  logger: StructuredLogger,
): void {
  app.useLogger(logger);
  app.setGlobalPrefix(API_PREFIX);
  app.enableShutdownHooks();
  app
    .getHttpAdapter()
    .getInstance()
    .set(
      'trust proxy',
      environment.TRUSTED_PROXIES.length ? environment.TRUSTED_PROXIES : false,
    );
  app.use((request: Request, response: Response, next: NextFunction) => {
    const incoming = request.headers['x-request-id'];
    const requestId =
      typeof incoming === 'string' && /^[a-zA-Z0-9._-]{1,64}$/.test(incoming)
        ? incoming
        : randomUUID();
    const started = performance.now();
    response.setHeader('X-Request-ID', requestId);
    response.setHeader('Cache-Control', 'no-store');
    response.on('finish', () =>
      logger.event('info', {
        event: 'http.request',
        requestId,
        method: request.method,
        route: request.route?.path ?? 'unmatched',
        statusCode: response.statusCode,
        durationMs: Math.round(performance.now() - started),
      }),
    );
    next();
  });
  app.use(json({ limit: '16kb' }));
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => callback(null, !origin || environment.CORS_ORIGINS.includes(origin)),
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'X-CSRF-Token',
    ],
    exposedHeaders: ['X-Request-ID'],
    credentials: false,
    maxAge: 600,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      validationError: { target: false, value: false },
      disableErrorMessages: true,
    }),
  );
  app.useGlobalFilters(new ApiErrorFilter(logger));
  if (environment.API_DOCS_ENABLED) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('RevuPing API')
        .setDescription(
          'First-party authentication, sessions and membership-authorized workspace access. Business endpoints are deferred.',
        )
        .setVersion('1')
        .build(),
    );
    SwaggerModule.setup(`${API_PREFIX}/docs`, app, document, {
      swaggerOptions: { persistAuthorization: false },
    });
  }
}
