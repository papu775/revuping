import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { emailTemplate } from './email-template';
import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createTransport } from 'nodemailer';
import { API_ENVIRONMENT, type ApiEnvironment } from '../config/environment';
import type { EmailAction } from '../generated/prisma/enums';

@Injectable()
export class EmailService {
  private readonly transport;
  constructor(
    @Inject(API_ENVIRONMENT) private readonly environment: ApiEnvironment,
  ) {
    this.transport = createTransport({
      host: environment.SMTP_HOST,
      port: environment.SMTP_PORT,
      secure: environment.SMTP_SECURE === 'true',
      requireTLS:
        environment.NODE_ENV === 'production' &&
        environment.SMTP_SECURE !== 'true',
      auth: environment.SMTP_USER
        ? { user: environment.SMTP_USER, pass: environment.SMTP_PASSWORD }
        : undefined,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
      logger: false,
      debug: false,
    });
  }
  async ready(): Promise<void> {
    try {
      await this.transport.verify();
    } catch {
      throw new ServiceUnavailableException();
    }
  }
  async send(to: string, purpose: EmailAction, token: string): Promise<void> {
    const verify = purpose === 'VERIFY_EMAIL';
    // Fragment keeps the secret out of HTTP access logs and referrers.
    const link = `${this.environment.WEB_URL}/${verify ? 'verify-email' : 'reset-password'}#token=${token}`;
    const title = verify
      ? 'Verify your RevuPing email'
      : 'Reset your RevuPing password';
    const content = emailTemplate(verify, link);
    try {
      const result = await this.transport.sendMail({
        from: this.environment.SMTP_FROM,
        to,
        subject: title,
        ...content,
        attachments: [
          {
            filename: 'revuping-logo.png',
            content: readFileSync(join(__dirname, 'assets/revuping-logo.png')),
            cid: 'revuping-logo',
            contentType: 'image/png',
            contentDisposition: 'inline',
          },
        ],
      });
      if (!result.accepted.length || result.rejected.length)
        throw new Error('Delivery rejected');
    } catch {
      throw new ServiceUnavailableException();
    }
  }
}
