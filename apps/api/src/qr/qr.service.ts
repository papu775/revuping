import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  feedbackInputSchema,
  onboardingDraftSchema,
  qrSettingsInputSchema,
} from 'api-contracts';
import { createHash } from 'node:crypto';
import { DatabaseService } from '../infrastructure/database.service';
import { AuthService } from '../auth/auth.service';
import type { Identity } from '../auth/auth.service';
import { API_ENVIRONMENT, type ApiEnvironment } from '../config/environment';
import { LogoStorage } from '../workspaces/logo-storage.service';
import type { Prisma } from '../generated/prisma/client';
const include = { business: true } as const;
type RecordLocation = Prisma.LocationGetPayload<{ include: typeof include }>;
@Injectable()
export class QrService {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: AuthService,
    private readonly storage: LogoStorage,
    @Inject(API_ENVIRONMENT) private readonly env: ApiEnvironment,
  ) {}
  private settings(location: RecordLocation) {
    const draft = onboardingDraftSchema.safeParse(location.business.draft);
    return {
      id: location.id,
      locationName: location.name,
      businessName: location.business.name,
      displayName: location.qrDisplayName,
      displayText: location.qrDisplayText,
      brandColor: location.qrBrandColor,
      layout: location.qrLayout,
      googleReviewUrl: location.googleReviewUrl ?? '',
      enabled: location.customerEnabled,
      revision: location.qrRevision,
      publicId: location.publicId,
      customerUrl: `${this.env.PUBLIC_CUSTOMER_BASE_URL}/r/${location.publicId}`,
      effectiveName: location.qrDisplayName || location.business.name,
      businessColor: draft.success ? draft.data.brandColor : '#7253bf',
      effectiveColor:
        location.qrBrandColor ??
        (draft.success ? draft.data.brandColor : '#7253bf'),
      hasLogo: !!location.business.logoKey,
    };
  }
  async list(identity: Identity, workspaceId: string) {
    return this.auth.available(async () => {
      const member = await this.db.client.membership.findUnique({
        where: {
          workspaceId_userId: { workspaceId, userId: identity.user.id },
        },
      });
      if (!member) throw new ForbiddenException();
      const locations = await this.db.client.location.findMany({
        where: { workspaceId, business: { completedAt: { not: null } } },
        include,
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
      });
      return locations.map((location) => this.settings(location));
    });
  }
  async save(
    identity: Identity,
    workspaceId: string,
    locationId: string,
    input: unknown,
  ) {
    const parsed = qrSettingsInputSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException();
    const value = parsed.data;
    return this.auth.available(() =>
      this.db.client.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "Workspace" WHERE "id"=${workspaceId}::uuid FOR UPDATE`;
        await tx.$queryRaw`SELECT "userId" FROM "Membership" WHERE "workspaceId"=${workspaceId}::uuid AND "userId"=${identity.user.id}::uuid FOR UPDATE`;
        const member = await tx.membership.findUnique({
          where: {
            workspaceId_userId: { workspaceId, userId: identity.user.id },
          },
        });
        if (member?.role !== 'OWNER') throw new ForbiddenException();
        await tx.$queryRaw`SELECT "id" FROM "Location" WHERE "id"=${locationId}::uuid AND "workspaceId"=${workspaceId}::uuid FOR UPDATE`;
        const location = await tx.location.findFirst({
          where: {
            id: locationId,
            workspaceId,
            business: { completedAt: { not: null } },
          },
          include,
        });
        if (!location) throw new NotFoundException();
        if (location.qrRevision !== value.revision)
          throw new ConflictException();
        const updated = await tx.location.update({
          where: { id: location.id },
          data: {
            qrDisplayName: value.displayName,
            qrDisplayText: value.displayText,
            qrBrandColor: value.brandColor,
            qrLayout: value.layout,
            googleReviewUrl: value.googleReviewUrl || null,
            customerEnabled: value.enabled,
            qrRevision: { increment: 1 },
          },
          include,
        });
        return this.settings(updated);
      }),
    );
  }
  private async publicLocation(publicId: string) {
    const location = await this.db.client.location.findFirst({
      where: {
        publicId,
        customerEnabled: true,
        business: { completedAt: { not: null } },
      },
      include,
    });
    if (!location) throw new NotFoundException();
    return location;
  }
  async customer(publicId: string) {
    return this.auth.available(async () => {
      const location = await this.publicLocation(publicId);
      const settings = this.settings(location);
      return {
        name: settings.effectiveName,
        locationName: location.name,
        displayText: settings.displayText,
        brandColor: settings.effectiveColor,
        hasLogo: settings.hasLogo,
        googleReviewUrl: location.googleReviewUrl,
      };
    });
  }
  async logo(publicId: string) {
    return this.auth.available(async () => {
      const location = await this.publicLocation(publicId);
      if (!location.business.logoKey) throw new NotFoundException();
      // Only the current sanitized logo of this enabled customer page is public.
      return this.storage.read(location.business.logoKey);
    });
  }
  async feedback(publicId: string, input: unknown) {
    const parsed = feedbackInputSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException();
    const { key, ...payload } = parsed.data;
    const hash = createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');
    return this.auth.available(() =>
      this.db.client.$transaction(async (tx) => {
        // Follow the workspace → location lock order used by owner mutations.
        // The workspace lock also prevents FK insertion from creating a lock cycle.
        const resolved = await tx.location.findUnique({
          where: { publicId },
          select: { workspaceId: true },
        });
        if (!resolved) throw new NotFoundException();
        await tx.$queryRaw`SELECT "id" FROM "Workspace" WHERE "id"=${resolved.workspaceId}::uuid FOR KEY SHARE`;
        // Concurrent disable/settings edits cannot race acceptance of feedback.
        await tx.$queryRaw`SELECT "id" FROM "Location" WHERE "publicId"=${publicId}::uuid FOR SHARE`;
        const location = await tx.location.findFirst({
          where: {
            publicId,
            customerEnabled: true,
            business: { completedAt: { not: null } },
          },
        });
        if (!location) throw new NotFoundException();
        // Transaction-scoped serialization plus a database uniqueness constraint.
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${location.id}:${key}`}, 0))::text`;
        const previous = await tx.privateFeedback.findUnique({
          where: {
            locationId_submissionKey: {
              locationId: location.id,
              submissionKey: key,
            },
          },
        });
        if (previous) {
          if (previous.payloadHash !== hash) throw new ConflictException();
        } else {
          await tx.privateFeedback.create({
            data: {
              workspaceId: location.workspaceId,
              locationId: location.id,
              submissionKey: key,
              payloadHash: hash,
              rating: payload.rating,
              message: payload.message,
              name: payload.name || null,
              email: payload.email || null,
            },
          });
        }
        return { received: true as const };
      }),
    );
  }
}
