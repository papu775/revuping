import { z } from 'zod';
import { isIP } from 'node:net';

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
  WEB_URL: z
    .string()
    .url()
    .default('http://localhost:3000')
    .refine((value) => {
      const url = new URL(value);
      return (
        ['http:', 'https:'].includes(url.protocol) &&
        url.origin === value &&
        !url.username &&
        !url.password
      );
    }),
  PUBLIC_CUSTOMER_BASE_URL: z
    .string()
    .url()
    .default('http://localhost:3000')
    .refine((value) => {
      const url = new URL(value);
      return (
        ['http:', 'https:'].includes(url.protocol) &&
        url.origin === value &&
        !url.username &&
        !url.password
      );
    }),
  S3_ENDPOINT: serviceUrl(['http:', 'https:']).optional(),
  S3_REGION: z.string().min(1).default('us-east-1'),
  S3_BUCKET: z
    .string()
    .regex(/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/)
    .default('revuping-logos'),
  S3_LOCAL_EMULATOR: z.enum(['true', 'false']).default('false'),
  S3_FORCE_PATH_STYLE: z.enum(['true', 'false']).default('false'),
  S3_ACCESS_KEY_ID: z.string().min(1).optional(),
  S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  SMTP_HOST: z.string().min(1).default('127.0.0.1'),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(1025),
  SMTP_SECURE: z.enum(['true', 'false']).default('false'),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().default('accounts@revuping.test'),
  AUTH_RATE_NAMESPACE: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[A-Za-z0-9:_-]+$/)
    .default('rp:auth'),
  // Exact proxy addresses/CIDRs only, never trust arbitrary forwarded IPs.
  TRUSTED_PROXIES: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    )
    .refine((values) =>
      values.every((value) => {
        const [address, prefix, extra] = value.split('/');
        const version = isIP(address);
        return (
          version !== 0 &&
          extra === undefined &&
          (prefix === undefined ||
            (/^\d+$/.test(prefix) &&
              Number(prefix) >= 0 &&
              Number(prefix) <= (version === 4 ? 32 : 128)))
        );
      }),
    ),
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
      `Invalid API configuration: ${fields.join(', ')}. See docs/AUTHENTICATION.md.`,
    );
  }
  if (
    result.data.NODE_ENV === 'production' &&
    (!input.WEB_URL ||
      !result.data.WEB_URL.startsWith('https://') ||
      !input.SMTP_HOST ||
      !input.SMTP_FROM ||
      !!result.data.SMTP_USER !== !!result.data.SMTP_PASSWORD)
  )
    throw new Error(
      'Invalid production auth configuration: WEB_URL, SMTP_HOST, SMTP_FROM, SMTP_USER/SMTP_PASSWORD.',
    );
  if (
    result.data.TRUSTED_PROXIES.some(
      (proxy) => Number(proxy.split('/')[1]) === 0,
    )
  )
    throw new Error(
      'Trust explicit proxy networks, not all network addresses.',
    );
  if (
    result.data.NODE_ENV === 'production' &&
    (result.data.CORS_ORIGINS.some(
      (origin) => !origin.startsWith('https://'),
    ) ||
      (result.data.S3_ENDPOINT &&
        !result.data.S3_ENDPOINT.startsWith('https://')))
  )
    throw new Error('Production CORS origins and S3 endpoints require HTTPS.');
  if (
    result.data.NODE_ENV === 'production' &&
    (!input.PUBLIC_CUSTOMER_BASE_URL ||
      !result.data.PUBLIC_CUSTOMER_BASE_URL.startsWith('https://'))
  )
    throw new Error(
      'Production requires an explicit HTTPS PUBLIC_CUSTOMER_BASE_URL.',
    );
  if (!!result.data.S3_ACCESS_KEY_ID !== !!result.data.S3_SECRET_ACCESS_KEY)
    throw new Error(
      'Configure both S3 credential fields or use the server credential chain.',
    );
  if (
    result.data.S3_LOCAL_EMULATOR === 'true' &&
    (result.data.NODE_ENV === 'production' || !result.data.S3_ENDPOINT)
  )
    throw new Error(
      'Local S3 emulator requires an endpoint and is forbidden in production.',
    );
  if (
    result.data.S3_LOCAL_EMULATOR !== 'true' &&
    [result.data.S3_ACCESS_KEY_ID, result.data.S3_SECRET_ACCESS_KEY].includes(
      'test',
    )
  )
    throw new Error(
      'Dummy S3 credentials are only allowed for the local emulator.',
    );
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
