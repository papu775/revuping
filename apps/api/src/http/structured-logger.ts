import type { LoggerService } from '@nestjs/common';
import pino, { type Logger, type Level } from 'pino';

const sensitiveKey =
  /^(authorization|cookie|set-cookie|password|passwordHash|passwd|token|tokenHash|csrfHash|csrfToken|access[_-]?token|refresh[_-]?token|secret|secretHash|smtp[_-]?password|client[_-]?secret|api[_-]?key|s3[_-]?access[_-]?key[_-]?id|s3[_-]?secret[_-]?access[_-]?key|database[_-]?url|redis[_-]?url|connection[_-]?string|email|phone)$/i;

export function redactSensitive(value: unknown): unknown {
  if (value instanceof Error) return { error: 'Internal error' };
  if (Array.isArray(value)) return value.map(redactSensitive);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        sensitiveKey.test(key) ? '[Redacted]' : redactSensitive(child),
      ]),
    );
  }
  if (typeof value === 'string') {
    return value
      .replace(
        /(?:postgresql|postgres|redis|rediss):\/\/[^\s"']+/gi,
        '[Redacted service URL]',
      )
      .replace(/Bearer\s+[^\s"']+/gi, 'Bearer [Redacted]');
  }
  return value;
}

export class StructuredLogger implements LoggerService {
  private readonly logger: Logger;

  constructor(level: string) {
    this.logger = pino({ level, base: { service: 'revuping-api' } });
  }

  event(level: Level, fields: Record<string, unknown>): void {
    this.logger[level](redactSensitive(fields) as Record<string, unknown>);
  }

  log(message: unknown, context?: string): void {
    this.write('info', message, context);
  }
  error(message: unknown, _stack?: string, context?: string): void {
    this.write('error', message, context);
  }
  warn(message: unknown, context?: string): void {
    this.write('warn', message, context);
  }
  debug(message: unknown, context?: string): void {
    this.write('debug', message, context);
  }
  verbose(message: unknown, context?: string): void {
    this.write('trace', message, context);
  }
  fatal(message: unknown, context?: string): void {
    this.write('fatal', message, context);
  }

  private write(level: Level, message: unknown, context?: string): void {
    this.event(level, { event: 'application', message, context });
  }
}
