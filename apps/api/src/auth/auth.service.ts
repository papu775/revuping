import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { DatabaseService } from '../infrastructure/database.service';
import type { Prisma, Session, User } from '../generated/prisma/client';
import type { SessionKind, EmailAction } from '../generated/prisma/enums';
import type { SessionResponse, NativeSessionResponse } from 'api-contracts';
import {
  credential,
  digest,
  hashPassword,
  validCredential,
  verifyPassword,
} from './credentials';
import { EmailService } from './email.service';
import type { LoginDto, RegisterDto } from './auth.dto';

export type Identity = { session: Session; user: User };
const day = 86400000;
export const publicUser = (user: User) => ({
  id: user.id,
  email: user.email,
  displayName: user.displayName,
  emailVerified: !!user.emailVerifiedAt,
});
export const publicSession = ({
  user,
  session,
}: Identity): SessionResponse => ({
  user: publicUser(user),
  expiresAt: session.expiresAt.toISOString(),
});

@Injectable()
export class AuthService {
  private readonly dummyHash = hashPassword(credential());
  constructor(
    private readonly database: DatabaseService,
    private readonly email: EmailService,
  ) {}
  private get db() {
    return this.database.client;
  }

  // Dependency errors stay sanitized and distinguish temporary failure from invalid credentials.
  async available<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException();
    }
  }
  async register(input: RegisterDto): Promise<{ message: string }> {
    return this.available(async () => {
      await this.email.ready();
      const passwordHash = await hashPassword(input.password);
      let user: User;
      try {
        user = await this.db.user.create({
          data: {
            email: input.email,
            displayName: input.displayName,
            passwordHash,
          },
        });
      } catch (error) {
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === 'P2002'
        )
          throw new ConflictException();
        throw error;
      }
      await this.sendAction(user, 'VERIFY_EMAIL');
      return {
        message: 'Account created. Check your email to verify it, then log in.',
      };
    });
  }
  private async sendAction(user: User, purpose: EmailAction): Promise<void> {
    const token = credential();
    const row = await this.db.emailActionToken.create({
      data: {
        userId: user.id,
        purpose,
        tokenHash: digest(token),
        expiresAt: new Date(
          Date.now() + (purpose === 'VERIFY_EMAIL' ? day : 30 * 60000),
        ),
      },
    });
    try {
      await this.email.send(user.email, purpose, token);
    } catch (error) {
      await this.db.emailActionToken.delete({ where: { id: row.id } });
      throw error;
    }
  }
  async requestAction(
    email: string,
    purpose: EmailAction,
  ): Promise<{ message: string }> {
    return this.available(async () => {
      // Check SMTP for both known and unknown accounts so outages don't reveal existence.
      await this.email.ready();
      const user = await this.db.user.findUnique({ where: { email } });
      if (user && (purpose === 'RESET_PASSWORD' || !user.emailVerifiedAt))
        await this.sendAction(user, purpose);
      return {
        message:
          'If the account is eligible, an email has been queued. Check your inbox.',
      };
    });
  }
  async verify(token: string): Promise<{ message: string }> {
    return this.available(async () => {
      const consumed = await this.db.$transaction(async (tx) => {
        const row = await tx.emailActionToken.findUnique({
          where: { tokenHash: digest(token) },
        });
        if (!row || row.purpose !== 'VERIFY_EMAIL') return false;
        await this.lockUser(tx, row.userId);
        const changed = await tx.emailActionToken.updateMany({
          where: {
            id: row.id,
            consumedAt: null,
            expiresAt: { gt: new Date() },
          },
          data: { consumedAt: new Date() },
        });
        if (!changed.count) return false;
        await tx.user.update({
          where: { id: row.userId },
          data: { emailVerifiedAt: new Date() },
        });
        return true;
      });
      if (!consumed) throw new BadRequestException();
      return { message: 'Email verified. You can now open your workspace.' };
    });
  }
  async reset(token: string, password: string): Promise<{ message: string }> {
    return this.available(async () => {
      const passwordHash = await hashPassword(password);
      const consumed = await this.db.$transaction(async (tx) => {
        const row = await tx.emailActionToken.findUnique({
          where: { tokenHash: digest(token) },
        });
        if (!row || row.purpose !== 'RESET_PASSWORD') return false;
        await this.lockUser(tx, row.userId);
        const changed = await tx.emailActionToken.updateMany({
          where: {
            id: row.id,
            consumedAt: null,
            expiresAt: { gt: new Date() },
          },
          data: { consumedAt: new Date() },
        });
        if (!changed.count) return false;
        await tx.user.update({
          where: { id: row.userId },
          data: { passwordHash, credentialVersion: { increment: 1 } },
        });
        await tx.emailActionToken.updateMany({
          where: {
            userId: row.userId,
            purpose: 'RESET_PASSWORD',
            consumedAt: null,
          },
          data: { consumedAt: new Date() },
        });
        await tx.session.updateMany({
          where: { userId: row.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        return true;
      });
      if (!consumed) throw new BadRequestException();
      return {
        message:
          'Password updated. All sessions have been signed out. Log in with your new password.',
      };
    });
  }
  async login(
    input: LoginDto,
    kind: SessionKind,
    csrf?: string,
  ): Promise<{
    identity: Identity;
    secret: string;
    native?: NativeSessionResponse;
  }> {
    return this.available(async () => {
      const user = await this.db.user.findUnique({
        where: { email: input.email },
      });
      const matched = await verifyPassword(
        user?.passwordHash ?? (await this.dummyHash),
        input.password,
      );
      if (!user?.passwordHash || !matched) throw new UnauthorizedException();
      const secret = credential();
      const refresh = credential();
      const now = Date.now();
      const identity = await this.db.$transaction(async (tx) => {
        await this.lockUser(tx, user.id);
        const current = await tx.user.findUniqueOrThrow({
          where: { id: user.id },
        });
        // A password reset that races verification must not leave an old-password session.
        if (current.credentialVersion !== user.credentialVersion)
          throw new UnauthorizedException();
        const session = await tx.session.create({
          data: {
            userId: user.id,
            kind,
            secretHash: digest(secret),
            csrfHash: csrf ? digest(csrf) : null,
            accessExpiresAt: new Date(
              now + (kind === 'WEB' ? 7 * day : 5 * 60000),
            ),
            expiresAt: new Date(now + (kind === 'WEB' ? 7 * day : 30 * day)),
          },
        });
        if (kind === 'NATIVE')
          await tx.refreshToken.create({
            data: {
              sessionId: session.id,
              tokenHash: digest(refresh),
              expiresAt: session.expiresAt,
            },
          });
        return { session, user: current };
      });
      return {
        identity,
        secret,
        native:
          kind === 'NATIVE'
            ? {
                ...publicSession(identity),
                accessToken: secret,
                accessExpiresAt: identity.session.accessExpiresAt.toISOString(),
                refreshToken: refresh,
              }
            : undefined,
      };
    });
  }
  async authenticate(secret: string, kind: SessionKind): Promise<Identity> {
    if (!validCredential(secret)) throw new UnauthorizedException();
    return this.available(async () => {
      const session = await this.db.session.findUnique({
        where: { secretHash: digest(secret) },
        include: { user: true },
      });
      if (
        !session ||
        session.kind !== kind ||
        session.revokedAt ||
        session.expiresAt <= new Date() ||
        session.accessExpiresAt <= new Date()
      )
        throw new UnauthorizedException();
      return { session, user: session.user };
    });
  }
  async logout(identity: Identity, all: boolean): Promise<{ message: string }> {
    return this.available(async () => {
      await this.db.$transaction(async (tx) => {
        await this.lockUser(tx, identity.user.id);
        await tx.session.updateMany({
          where: all
            ? { userId: identity.user.id, revokedAt: null }
            : { id: identity.session.id },
          data: { revokedAt: new Date() },
        });
      });
      return { message: all ? 'All sessions signed out.' : 'Signed out.' };
    });
  }
  async refresh(token: string): Promise<NativeSessionResponse> {
    return this.available(async () => {
      const row = await this.db.refreshToken.findUnique({
        where: { tokenHash: digest(token) },
      });
      if (!row) throw new UnauthorizedException();
      const result = await this.db.$transaction(async (tx) => {
        // Row lock serializes rotation and replay; failed replay revocation must COMMIT.
        await tx.$queryRaw`SELECT "id" FROM "Session" WHERE "id" = ${row.sessionId}::uuid FOR UPDATE`;
        const session = await tx.session.findUniqueOrThrow({
          where: { id: row.sessionId },
          include: { user: true },
        });
        const current = await tx.refreshToken.findUniqueOrThrow({
          where: { id: row.id },
        });
        if (current.consumedAt) {
          await tx.session.update({
            where: { id: session.id },
            data: { revokedAt: new Date() },
          });
          return null;
        }
        if (
          session.revokedAt ||
          session.kind !== 'NATIVE' ||
          session.expiresAt <= new Date() ||
          current.expiresAt <= new Date()
        )
          return null;
        const accessToken = credential();
        const refreshToken = credential();
        const accessExpiresAt = new Date(Date.now() + 5 * 60000);
        await tx.refreshToken.update({
          where: { id: current.id },
          data: { consumedAt: new Date() },
        });
        await tx.refreshToken.create({
          data: {
            sessionId: session.id,
            tokenHash: digest(refreshToken),
            expiresAt: session.expiresAt,
          },
        });
        await tx.session.update({
          where: { id: session.id },
          data: { secretHash: digest(accessToken), accessExpiresAt },
        });
        return {
          ...publicSession({ session, user: session.user }),
          accessToken,
          refreshToken,
          accessExpiresAt: accessExpiresAt.toISOString(),
        };
      });
      if (!result) throw new UnauthorizedException();
      return result;
    });
  }
  async refreshAccount(token: string): Promise<string> {
    return this.available(async () => {
      const row = await this.db.refreshToken.findUnique({
        where: { tokenHash: digest(token) },
        select: { sessionId: true },
      });
      return row?.sessionId ?? digest(token);
    });
  }
  private async lockUser(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<void> {
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId}::uuid FOR UPDATE`;
  }
}
