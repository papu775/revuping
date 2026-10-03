import { z } from 'zod';

const serviceUrl = (protocols: string[]) =>
  z
    .string()
    .url()
    .refine((value) => {
      try {
        const url = new URL(value);
        return protocols.includes(url.protocol) && !!url.hostname && !url.hash;
      } catch {
        return false;
      }
    });

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  API_HOST: z.string().trim().min(1).default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3002),
  DATABASE_URL: serviceUrl(['postgresql:', 'postgres:']),
  REDIS_URL: serviceUrl(['redis:', 'rediss:']),
  CORS_ORIGINS: z
    .string()
    .trim()
    .min(1)
    .transform((value) => value.split(',').map((origin) => origin.trim()))
    .pipe(
      z
        .array(
          z
            .string()
            .url()
            .refine((value) => {
              try {
                const url = new URL(value);
                return (
                  ['http:', 'https:'].includes(url.protocol) &&
                  url.origin === value &&
                  !url.username &&
                  !url.password
                );
              } catch {
                return false;
              }
            }),
        )
        .min(1),
    ),
  API_DOCS_ENABLED: z.enum(['true', 'false']).optional(),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
});

export function validateEnvironment(input: Record<string, unknown>) {
  const result = environmentSchema.safeParse(input);
  if (!result.success) {
    const fields = [
      ...new Set(result.error.issues.map((issue) => issue.path.join('.'))),
    ];
    throw new Error(
      `Invalid API configuration: ${fields.join(', ')}. See apps/api/.env.example.`,
    );
  }
  return Object.freeze({
    ...result.data,
    API_DOCS_ENABLED:
      result.data.API_DOCS_ENABLED === undefined
        ? result.data.NODE_ENV !== 'production'
        : result.data.API_DOCS_ENABLED === 'true',
  });
}

export type ApiEnvironment = ReturnType<typeof validateEnvironment>;
export const API_ENVIRONMENT = Symbol('API_ENVIRONMENT');
