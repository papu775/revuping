import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { API_ENVIRONMENT, type ApiEnvironment } from '../config/environment';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  readonly client: PrismaClient;

  constructor(@Inject(API_ENVIRONMENT) environment: ApiEnvironment) {
    const adapter = new PrismaPg({
      connectionString: environment.DATABASE_URL,
      max: 5,
      connectionTimeoutMillis: 1500,
      query_timeout: 1500,
      statement_timeout: 1500,
      idleTimeoutMillis: 10000,
    });
    this.client = new PrismaClient({ adapter, log: [] });
  }

  async check(): Promise<void> {
    await this.client.$queryRaw`SELECT 1`;
  }

  async onApplicationShutdown(): Promise<void> {
    await this.client.$disconnect();
  }
}
