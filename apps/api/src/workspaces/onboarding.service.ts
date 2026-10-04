import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  initialOnboarding,
  onboardingDraftSchema,
  saveOnboardingSchema,
  type OnboardingResponse,
} from 'api-contracts';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../infrastructure/database.service';
import type { Identity } from '../auth/auth.service';
import type { Prisma } from '../generated/prisma/client';
import { LogoStorage, sanitizeLogo } from './logo-storage.service';
@Injectable()
export class OnboardingService {
  constructor(
    private readonly db: DatabaseService,
    private readonly storage: LogoStorage,
  ) {}
  async authorize(
    identity: Identity,
    id: string,
    write = false,
    client = this.db.client,
  ) {
    const member = await client.membership.findUnique({
      where: {
        workspaceId_userId: { workspaceId: id, userId: identity.user.id },
      },
    });
    if (!member || (write && member.role !== 'OWNER'))
      throw new ForbiddenException();
  }
  private response(
    business: {
      revision: number;
      draft: Prisma.JsonValue | null;
      completedAt: Date | null;
      logoKey: string | null;
    } | null,
    name: string,
  ): OnboardingResponse {
    return {
      revision: business?.revision ?? 0,
      draft: business?.draft
        ? onboardingDraftSchema.parse(business.draft)
        : initialOnboarding(name),
      completedAt: business?.completedAt?.toISOString() ?? null,
      hasLogo: !!business?.logoKey,
    };
  }
  async read(identity: Identity, id: string) {
    await this.authorize(identity, id);
    const workspace = await this.db.client.workspace.findUniqueOrThrow({
      where: { id },
      include: { business: true },
    });
    return this.response(workspace.business, workspace.name);
  }
  async save(identity: Identity, id: string, body: unknown) {
    const input = saveOnboardingSchema.safeParse(body);
    if (!input.success) throw new BadRequestException();
    const { draft, revision, complete } = input.data;
    if (complete && (!draft.category || !draft.locationName))
      throw new BadRequestException();
    return this.db.client.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Workspace" WHERE "id" = ${id}::uuid FOR UPDATE`;
      const member = await tx.membership.findUnique({
        where: {
          workspaceId_userId: { workspaceId: id, userId: identity.user.id },
        },
      });
      if (member?.role !== 'OWNER') throw new ForbiddenException();
      const previous = await tx.business.findUnique({
        where: { workspaceId: id },
      });
      if (previous?.completedAt && (!draft.category || !draft.locationName))
        throw new BadRequestException();
      // Exact replay succeeds; a different stale edit receives 409 and must reload.
      if (
        previous &&
        JSON.stringify(onboardingDraftSchema.parse(previous.draft)) ===
          JSON.stringify(draft) &&
        (!complete || previous.completedAt)
      )
        return this.response(previous, draft.name);
      if ((previous?.revision ?? 0) !== revision) throw new ConflictException();
      const business = await tx.business.upsert({
        where: { workspaceId: id },
        create: {
          workspaceId: id,
          name: draft.name,
          draft,
          revision: 1,
          completedAt: complete ? new Date() : null,
        },
        update: {
          name: draft.name,
          draft,
          revision: { increment: 1 },
          ...(complete
            ? { completedAt: previous?.completedAt ?? new Date() }
            : {}),
        },
      });
      await tx.workspace.update({ where: { id }, data: { name: draft.name } });
      if (complete || previous?.completedAt) {
        const location = await tx.location.findFirst({
          where: { workspaceId: id, businessId: business.id, isPrimary: true },
        });
        const data = {
          name: draft.locationName,
          address: draft.address || null,
          timezone: draft.timezone,
          hours: draft.hours,
        };
        if (location)
          await tx.location.update({ where: { id: location.id }, data });
        else
          await tx.location.create({
            data: {
              ...data,
              workspaceId: id,
              businessId: business.id,
              isPrimary: true,
            },
          });
      }
      return this.response(business, draft.name);
    });
  }
  async upload(
    identity: Identity,
    id: string,
    revision: number,
    buffer: Buffer,
  ) {
    await this.authorize(identity, id, true);
    const image = await sanitizeLogo(buffer);
    const key = `workspaces/${id}/logos/${randomUUID()}.webp`;
    // Journal before S3: crashes, ambiguous writes and failed attachment remain recoverable.
    await this.db.client.logoObject.create({ data: { key, workspaceId: id } });
    try {
      await this.storage.put(key, image);
      return await this.attach(identity, id, revision, key);
    } catch (error) {
      await this.cleanupKey(key, id).catch(() => undefined);
      throw error;
    }
  }
  async attach(
    identity: Identity,
    id: string,
    revision: number,
    key: string | null,
  ) {
    const result = await this.db.client.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Workspace" WHERE "id" = ${id}::uuid FOR UPDATE`;
      const member = await tx.membership.findUnique({
        where: {
          workspaceId_userId: { workspaceId: id, userId: identity.user.id },
        },
      });
      if (member?.role !== 'OWNER') throw new ForbiddenException();
      const business = await tx.business.findUnique({
        where: { workspaceId: id },
      });
      if (!business) throw new BadRequestException();
      if (business.revision !== revision) throw new ConflictException();
      const updated = await tx.business.update({
        where: { workspaceId: id },
        data: { logoKey: key, revision: { increment: 1 } },
      });
      return { updated, old: business.logoKey };
    });
    if (result.old)
      await this.cleanupKey(result.old, id).catch(() => undefined);
    return this.response(result.updated, result.updated.name);
  }
  async logo(identity: Identity, id: string) {
    await this.authorize(identity, id);
    const business = await this.db.client.business.findUnique({
      where: { workspaceId: id },
    });
    if (!business?.logoKey) throw new NotFoundException();
    return this.storage.read(business.logoKey);
  }
  async cleanupKey(key: string, id: string) {
    if (!key.startsWith(`workspaces/${id}/logos/`))
      throw new ForbiddenException();
    if (await this.db.client.business.findFirst({ where: { logoKey: key } }))
      return;
    await this.storage.remove(key);
    await this.db.client.logoObject.deleteMany({
      where: { key, workspaceId: id },
    });
  }
}
