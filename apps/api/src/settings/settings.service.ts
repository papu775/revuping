import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  acceptInvitationSchema,
  invitationActionSchema,
  inviteInputSchema,
  locationInputSchema,
  memberChangeSchema,
  pageInputSchema,
  settingsInputSchema,
  type LocationInput,
} from 'api-contracts';
import { createHash, randomBytes } from 'node:crypto';
import { AuthService, type Identity } from '../auth/auth.service';
import { EmailService } from '../auth/email.service';
import { DatabaseService } from '../infrastructure/database.service';
import type {
  Location,
  Prisma,
  TeamInvitation,
} from '../generated/prisma/client';
const hash = (value: string) =>
  createHash('sha256').update(value).digest('hex');
const expires = () => new Date(Date.now() + 7 * 86400000);
const safeInvitation = (v: TeamInvitation) => ({
  id: v.id,
  name: v.name,
  email: v.email,
  role: v.role,
  expiresAt: v.expiresAt.toISOString(),
  acceptedAt: v.acceptedAt?.toISOString() || null,
  revokedAt: v.revokedAt?.toISOString() || null,
  delivery: v.delivery,
  revision: v.revision,
});
@Injectable()
export class SettingsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: AuthService,
    private readonly mail: EmailService,
  ) {}
  private async authorize(
    tx: Prisma.TransactionClient,
    identity: Identity,
    id: string,
    write: boolean,
  ) {
    if (write)
      await tx.$queryRaw`SELECT id FROM "Workspace" WHERE id=${id}::uuid FOR UPDATE`;
    else
      await tx.$queryRaw`SELECT id FROM "Workspace" WHERE id=${id}::uuid FOR KEY SHARE`;
    await tx.$queryRaw`SELECT "userId" FROM "Membership" WHERE "workspaceId"=${id}::uuid AND "userId"=${identity.user.id}::uuid FOR SHARE`;
    const member = await tx.membership.findUnique({
      where: {
        workspaceId_userId: { workspaceId: id, userId: identity.user.id },
      },
    });
    if (!member || (write && member.role !== 'OWNER'))
      throw new ForbiddenException();
    return member;
  }
  private run<T>(
    identity: Identity,
    id: string,
    write: boolean,
    action: (tx: Prisma.TransactionClient, owner: boolean) => Promise<T>,
  ) {
    return this.auth.available(() =>
      this.db.client.$transaction(async (tx) => {
        const member = await this.authorize(tx, identity, id, write);
        return action(tx, member.role === 'OWNER');
      }),
    );
  }
  async settings(identity: Identity, id: string) {
    return this.run(
      identity,
      id,
      false,
      async (tx) =>
        (await tx.workspaceSettings.findUnique({
          where: { workspaceId: id },
          omit: { workspaceId: true },
        })) || {
          revision: 0,
          weekly: false,
          feedback: false,
          reminders: false,
          requestTemplate:
            'Hi {name}, thanks for visiting. Share your experience: {link}',
          rebookingTemplate: 'Hi {name}, ready for another visit? {link}',
        },
    );
  }
  async saveSettings(identity: Identity, id: string, body: unknown) {
    const parsed = settingsInputSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException();
    return this.run(identity, id, true, async (tx) => {
      const previous = await tx.workspaceSettings.findUnique({
        where: { workspaceId: id },
      });
      if ((previous?.revision || 0) !== parsed.data.revision)
        throw new ConflictException();
      const { kind: _kind, revision: _revision, ...data } = parsed.data;
      return tx.workspaceSettings.upsert({
        where: { workspaceId: id },
        create: { workspaceId: id, ...data, revision: 1 },
        update: { ...data, revision: { increment: 1 } },
        omit: { workspaceId: true },
      });
    });
  }
  async team(identity: Identity, id: string, query: unknown) {
    const parsed = pageInputSchema.safeParse(query);
    if (!parsed.success) throw new BadRequestException();
    return this.run(identity, id, false, async (tx, owner) => {
      const total = await tx.membership.count({ where: { workspaceId: id } });
      const items = await tx.membership.findMany({
        where: { workspaceId: id },
        include: { user: { select: { displayName: true, email: true } } },
        orderBy: [{ createdAt: 'asc' }, { userId: 'asc' }],
        take: 25,
        skip: (parsed.data.page - 1) * 25,
      });
      return {
        items: items.map((v) => ({
          id: v.userId,
          name: v.user.displayName || 'Team member',
          email: owner ? v.user.email : null,
          role: v.role,
          revision: v.revision,
        })),
        total,
        page: parsed.data.page,
        pageSize: 25 as const,
      };
    });
  }
  async changeMember(
    identity: Identity,
    id: string,
    userId: string,
    body: unknown,
  ) {
    const parsed = memberChangeSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException();
    return this.run(identity, id, true, async (tx) => {
      const member = await tx.membership.findUnique({
        where: { workspaceId_userId: { workspaceId: id, userId } },
      });
      if (!member) throw new NotFoundException();
      if (member.revision !== parsed.data.revision)
        throw new ConflictException();
      if (
        member.role === 'OWNER' &&
        (parsed.data.remove || parsed.data.role !== 'OWNER') &&
        (await tx.membership.count({
          where: { workspaceId: id, role: 'OWNER' },
        })) <= 1
      )
        throw new ConflictException();
      if (parsed.data.remove) {
        await tx.$executeRaw`INSERT INTO "FeedbackActivity" (id,"feedbackId","workspaceId",key,kind,body,"actorId","actorName") SELECT gen_random_uuid(),id,"workspaceId",gen_random_uuid(),'PLAN','Assignment cleared after team access was removed.',${identity.user.id}::uuid,${(identity.user.displayName || 'Team member').slice(0, 100)} FROM "PrivateFeedback" WHERE "workspaceId"=${id}::uuid AND "assigneeId"=${userId}::uuid`;
        await tx.privateFeedback.updateMany({
          where: { workspaceId: id, assigneeId: userId },
          data: { assigneeId: null, revision: { increment: 1 } },
        });
        await tx.teamInvitation.updateMany({
          where: {
            workspaceId: id,
            createdBy: userId,
            acceptedAt: null,
            revokedAt: null,
          },
          data: {
            revokedAt: new Date(),
            tokenHash: null,
            revision: { increment: 1 },
          },
        });
        await tx.membership.delete({
          where: { workspaceId_userId: { workspaceId: id, userId } },
        });
      } else {
        await tx.membership.update({
          where: { workspaceId_userId: { workspaceId: id, userId } },
          data: { role: parsed.data.role, revision: { increment: 1 } },
        });
        if (parsed.data.role !== 'OWNER')
          await tx.teamInvitation.updateMany({
            where: {
              workspaceId: id,
              createdBy: userId,
              acceptedAt: null,
              revokedAt: null,
            },
            data: {
              revokedAt: new Date(),
              tokenHash: null,
              revision: { increment: 1 },
            },
          });
      }
      return {
        message: parsed.data.remove
          ? 'Workspace access removed.'
          : 'Team role updated.',
      };
    });
  }
  async invitations(identity: Identity, id: string, query: unknown) {
    const parsed = pageInputSchema.safeParse(query);
    if (!parsed.success) throw new BadRequestException();
    return this.run(identity, id, true, async (tx) => ({
      items: (
        await tx.teamInvitation.findMany({
          where: { workspaceId: id },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take: 25,
          skip: (parsed.data.page - 1) * 25,
        })
      ).map(safeInvitation),
      total: await tx.teamInvitation.count({ where: { workspaceId: id } }),
      page: parsed.data.page,
      pageSize: 25 as const,
    }));
  }
  private async deliver(
    invite: TeamInvitation,
    token: string,
    business: string,
  ) {
    let delivery = 'SENT';
    try {
      await this.mail.invitation(invite.email, invite.name, business, token);
    } catch {
      delivery = 'FAILED';
    }
    // An older SMTP attempt cannot overwrite the outcome of a rotated/revoked invitation.
    await this.auth.available(() =>
      this.db.client.teamInvitation.updateMany({
        where: {
          id: invite.id,
          tokenHash: invite.tokenHash,
          revision: invite.revision,
          revokedAt: null,
          acceptedAt: null,
        },
        data: { delivery },
      }),
    );
    return safeInvitation({ ...invite, delivery });
  }
  async invite(identity: Identity, id: string, body: unknown) {
    const parsed = inviteInputSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException();
    const v = parsed.data;
    const token = randomBytes(32).toString('base64url');
    const result = await this.run(identity, id, true, async (tx) => {
      const prior = await tx.teamInvitation.findUnique({
        where: { workspaceId_key: { workspaceId: id, key: v.key } },
      });
      if (prior) {
        if (
          prior.email.toLowerCase() !== v.email ||
          prior.name !== v.name ||
          prior.role !== v.role ||
          prior.createdBy !== identity.user.id
        )
          throw new ConflictException();
        return { invite: prior, business: '', send: false };
      }
      if (
        await tx.membership.findFirst({
          where: { workspaceId: id, user: { email: v.email } },
        })
      )
        throw new ConflictException();
      await tx.teamInvitation.updateMany({
        where: {
          workspaceId: id,
          email: v.email,
          acceptedAt: null,
          revokedAt: null,
          expiresAt: { lte: new Date() },
        },
        data: {
          revokedAt: new Date(),
          tokenHash: null,
          revision: { increment: 1 },
        },
      });
      if (
        await tx.teamInvitation.findFirst({
          where: {
            workspaceId: id,
            email: v.email,
            acceptedAt: null,
            revokedAt: null,
          },
        })
      )
        throw new ConflictException();
      if (
        (await tx.teamInvitation.count({
          where: { workspaceId: id, acceptedAt: null, revokedAt: null },
        })) >= 500
      )
        throw new BadRequestException();
      const workspace = await tx.workspace.findUniqueOrThrow({ where: { id } });
      const invite = await tx.teamInvitation.create({
        data: {
          workspaceId: id,
          ...v,
          createdBy: identity.user.id,
          tokenHash: hash(token),
          expiresAt: expires(),
        },
      });
      return { invite, business: workspace.name, send: true };
    });
    return result.send
      ? this.deliver(result.invite, token, result.business)
      : safeInvitation(result.invite);
  }
  async invitationAction(
    identity: Identity,
    id: string,
    inviteId: string,
    body: unknown,
  ) {
    const parsed = invitationActionSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException();
    const token = randomBytes(32).toString('base64url');
    const result = await this.run(identity, id, true, async (tx) => {
      const invite = await tx.teamInvitation.findFirst({
        where: { id: inviteId, workspaceId: id },
      });
      if (!invite) throw new NotFoundException();
      if (
        invite.revision !== parsed.data.revision ||
        invite.acceptedAt ||
        invite.revokedAt
      )
        throw new ConflictException();
      const updated = await tx.teamInvitation.update({
        where: { id: inviteId },
        data: {
          revision: { increment: 1 },
          ...(parsed.data.action === 'revoke'
            ? { revokedAt: new Date(), tokenHash: null }
            : {
                tokenHash: hash(token),
                expiresAt: expires(),
                delivery: 'PENDING',
                createdBy: identity.user.id,
              }),
        },
      });
      return {
        invite: updated,
        business: (await tx.workspace.findUniqueOrThrow({ where: { id } }))
          .name,
      };
    });
    return parsed.data.action === 'resend'
      ? this.deliver(result.invite, token, result.business)
      : safeInvitation(result.invite);
  }
  async accept(identity: Identity, body: unknown) {
    const parsed = acceptInvitationSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException();
    return this.auth.available(() =>
      this.db.client.$transaction(async (tx) => {
        const found = await tx.teamInvitation.findUnique({
          where: { tokenHash: hash(parsed.data.token) },
        });
        if (!found) throw new BadRequestException();
        await tx.$queryRaw`SELECT id FROM "Workspace" WHERE id=${found.workspaceId}::uuid FOR UPDATE`;
        const invite = await tx.teamInvitation.findUniqueOrThrow({
          where: { id: found.id },
        });
        if (
          invite.tokenHash !== hash(parsed.data.token) ||
          invite.revokedAt ||
          invite.expiresAt <= new Date() ||
          invite.email.toLowerCase() !== identity.user.email.toLowerCase()
        )
          throw new BadRequestException();
        const creator = await tx.membership.findUnique({
          where: {
            workspaceId_userId: {
              workspaceId: invite.workspaceId,
              userId: invite.createdBy,
            },
          },
        });
        if (creator?.role !== 'OWNER') throw new BadRequestException();
        if (invite.acceptedAt && invite.acceptedBy !== identity.user.id)
          throw new BadRequestException();
        let member = await tx.membership.findUnique({
          where: {
            workspaceId_userId: {
              workspaceId: invite.workspaceId,
              userId: identity.user.id,
            },
          },
        });
        if (invite.acceptedAt && !member) throw new BadRequestException();
        if (!member) {
          if (
            (await tx.membership.count({
              where: { workspaceId: invite.workspaceId },
            })) >= 500
          )
            throw new BadRequestException();
          member = await tx.membership.create({
            data: {
              workspaceId: invite.workspaceId,
              userId: identity.user.id,
              role: invite.role,
            },
          });
        }
        if (!invite.acceptedAt)
          await tx.teamInvitation.update({
            where: { id: invite.id },
            data: {
              acceptedAt: new Date(),
              acceptedBy: identity.user.id,
              revision: { increment: 1 },
            },
          });
        const workspace = await tx.workspace.findUniqueOrThrow({
          where: { id: invite.workspaceId },
        });
        return { id: workspace.id, name: workspace.name, role: member.role };
      }),
    );
  }
  private location(v: Location) {
    return {
      id: v.id,
      publicId: v.publicId,
      name: v.name,
      address: v.address || '',
      timezone: v.timezone,
      hours: v.hours || Array.from({ length: 7 }, () => []),
      closedDays: v.closedDays || Array(7).fill(false),
      revision: v.detailsRevision,
      archived: !!v.archivedAt,
      primary: v.isPrimary,
    };
  }
  async locations(identity: Identity, id: string) {
    return this.run(identity, id, false, async (tx) =>
      (
        await tx.location.findMany({
          where: { workspaceId: id },
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
          take: 500,
        })
      ).map((v) => this.location(v)),
    );
  }
  private locationData(v: LocationInput) {
    return {
      name: v.name,
      address: v.address || null,
      timezone: v.timezone,
      hours: v.hours,
      closedDays: v.closedDays,
    };
  }
  async saveLocation(
    identity: Identity,
    id: string,
    locationId: string | null,
    body: unknown,
  ) {
    const parsed = locationInputSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException();
    const v = parsed.data;
    return this.run(identity, id, true, async (tx) => {
      const business = await tx.business.findUnique({
        where: { workspaceId: id },
      });
      if (!business?.completedAt) throw new BadRequestException();
      if (!locationId) {
        if (!v.key || v.revision !== 0 || v.archived)
          throw new BadRequestException();
        const previous = await tx.location.findUnique({
          where: {
            workspaceId_creationKey: { workspaceId: id, creationKey: v.key },
          },
        });
        if (previous) {
          const prior = this.location(previous);
          if (
            JSON.stringify({
              name: prior.name,
              address: prior.address,
              timezone: prior.timezone,
              hours: prior.hours,
              closedDays: prior.closedDays,
              archived: prior.archived,
            }) !==
            JSON.stringify({
              name: v.name,
              address: v.address,
              timezone: v.timezone,
              hours: v.hours,
              closedDays: v.closedDays,
              archived: v.archived,
            })
          )
            throw new ConflictException();
          return prior;
        }
        if ((await tx.location.count({ where: { workspaceId: id } })) >= 500)
          throw new BadRequestException();
        return this.location(
          await tx.location.create({
            data: {
              workspaceId: id,
              businessId: business.id,
              creationKey: v.key,
              ...this.locationData(v),
            },
          }),
        );
      }
      if (v.key) throw new BadRequestException();
      const location = await tx.location.findFirst({
        where: { id: locationId, workspaceId: id },
      });
      if (!location) throw new NotFoundException();
      if (location.detailsRevision !== v.revision)
        throw new ConflictException();
      // The primary location is edited with the business draft to preserve authoritative onboarding state.
      if (location.isPrimary) throw new BadRequestException();
      return this.location(
        await tx.location.update({
          where: { id: locationId },
          data: {
            ...this.locationData(v),
            detailsRevision: { increment: 1 },
            archivedAt: v.archived ? location.archivedAt || new Date() : null,
            ...(v.archived ? { customerEnabled: false } : {}),
            qrRevision: { increment: 1 },
          },
        }),
      );
    });
  }
}
