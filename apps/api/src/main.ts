import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { validateEnvironment } from './config/environment';
import { configureApp } from './http/configure-app';
import { StructuredLogger } from './http/structured-logger';

async function bootstrap() {
  try {
    // Nx runs this API from the workspace root. Exported variables take precedence.
    process.loadEnvFile(resolve(process.env.API_ENV_FILE ?? 'apps/api/.env'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
      throw new Error('Unable to load API environment file');
  }
  const environment = validateEnvironment(process.env);
  const logger = new StructuredLogger(environment.LOG_LEVEL);
  const app = await NestFactory.create(AppModule.configure(environment), {
    logger,
    abortOnError: false,
  });
  configureApp(app, environment, logger);
  await app.listen(environment.PORT, environment.API_HOST);
  logger.event('info', {
    event: 'api.started',
    port: environment.PORT,
    docsEnabled: environment.API_DOCS_ENABLED,
  });
}

void bootstrap().catch((error: unknown) => {
  // Configuration errors contain field names only. All other startup errors stay generic.
  const message =
    error instanceof Error &&
    error.message.startsWith('Invalid API configuration:')
      ? error.message
      : 'API startup failed';
  new StructuredLogger('error').event('fatal', {
    event: 'api.startup.failed',
    message,
  });
  process.exit(1);
});
