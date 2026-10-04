import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  inboxNoteSchema,
  inboxPlanSchema,
  inboxQuerySchema,
} from 'api-contracts';
import { randomUUID } from 'node:crypto';
import { AuthService, type Identity } from '../auth/auth.service';
import { DatabaseService } from '../infrastructure/database.service';
import type { Prisma } from '../generated/prisma/client';
const include = {
  location: { select: { name: true } },
  assignee: { select: { displayName: true } },
} as const;
type Item = Prisma.PrivateFeedbackGetPayload<{ include: typeof include }>;
@Injectable()
export class FeedbackService {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: AuthService,
  ) {}
  private item(value: Item) {
    return {
      id: value.id,
      locationId: value.locationId,
      locationName: value.location.name,
      name: value.name,
      email: value.email,
      rating: value.rating,
      message: value.message,
      createdAt: value.createdAt.toISOString(),
      updatedAt: value.updatedAt.toISOString(),
      revision: value.revision,
      status: value.status,
      priority: value.priority,
      assigneeId: value.assigneeId,
      assigneeName: value.assignee
        ? value.assignee.displayName || 'Team member'
        : null,
      dueDate: value.dueDate,
      tags: value.tags,
      resolutionSummary: value.resolutionSummary,
    };
  }
  private async authorize(
    tx: Prisma.TransactionClient,
    identity: Identity,
    workspaceId: string,
  ) {
    // All reads and writes hold membership through the transaction, including revocation races.
    await tx.$queryRaw`SELECT "id" FROM "Workspace" WHERE "id"=${workspaceId}::uuid FOR KEY SHARE`;
    await tx.$queryRaw`SELECT "userId" FROM "Membership" WHERE "workspaceId"=${workspaceId}::uuid AND "userId"=${identity.user.id}::uuid FOR SHARE`;
    const membership = await tx.membership.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: identity.user.id } },
    });
    if (!membership) throw new ForbiddenException();
  }
  private transaction<T>(
    identity: Identity,
    workspaceId: string,
    action: (tx: Prisma.TransactionClient) => Promise<T>,
  ) {
    return this.auth.available(() =>
      this.db.client.$transaction(async (tx) => {
        await this.authorize(tx, identity, workspaceId);
        return action(tx);
      }),
    );
  }
  async list(identity: Identity, workspaceId: string, query: unknown) {
    const parsed = inboxQuerySchema.safeParse(query);
    if (!parsed.success) throw new BadRequestException();
    const v = parsed.data;
    return this.transaction(identity, workspaceId, async (tx) => {
      const where: Prisma.PrivateFeedbackWhereInput = {
        workspaceId,
        ...(v.location ? { locationId: v.location } : {}),
        ...(v.status === 'OVERDUE'
          ? {
              status: { not: 'RESOLVED' },
              dueDate: { not: '', lt: new Date().toISOString().slice(0, 10) },
            }
          : v.status === 'ALL'
            ? {}
            : v.status === 'UNRESOLVED'
              ? { status: { not: 'RESOLVED' } }
              : { status: v.status }),
        ...(v.query
          ? {
              OR: [
                { name: { contains: v.query, mode: 'insensitive' } },
                { message: { contains: v.query, mode: 'insensitive' } },
                {
                  assignee: {
                    displayName: { contains: v.query, mode: 'insensitive' },
                  },
                },
              ],
            }
          : {}),
      };
      const total = await tx.privateFeedback.count({ where });
      const items = await tx.privateFeedback.findMany({
        where,
        include,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 25,
        skip: (v.page - 1) * 25,
      });
      return {
        items: items.map((item) => this.item(item)),
        total,
        page: v.page,
        pageSize: 25 as const,
      };
    });
  }
  async members(identity: Identity, workspaceId: string) {
    return this.transaction(identity, workspaceId, async (tx) =>
      (
        await tx.membership.findMany({
          where: { workspaceId },
          include: { user: { select: { id: true, displayName: true } } },
          orderBy: [{ createdAt: 'asc' }, { userId: 'asc' }],
          take: 100,
        })
      ).map((m) => ({
        id: m.user.id,
        name: m.user.displayName || 'Team member',
      })),
    );
  }
  async history(
    identity: Identity,
    workspaceId: string,
    id: string,
    query: unknown,
  ) {
    const parsed = inboxQuerySchema.pick({ page: true }).safeParse(query);
    if (!parsed.success) throw new BadRequestException();
    return this.transaction(identity, workspaceId, async (tx) => {
      if (
        !(await tx.privateFeedback.findFirst({
          where: { id, workspaceId },
          select: { id: true },
        }))
      )
        throw new NotFoundException();
      const where = { feedbackId: id, workspaceId };
      const total = await tx.feedbackActivity.count({ where });
      const items = await tx.feedbackActivity.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 25,
        skip: (parsed.data.page - 1) * 25,
        select: {
          id: true,
          kind: true,
          body: true,
          actorName: true,
          createdAt: true,
        },
      });
      return {
        items: items.map((v) => ({
          ...v,
          createdAt: v.createdAt.toISOString(),
        })),
        total,
        page: parsed.data.page,
        pageSize: 25 as const,
      };
    });
  }
  private async lock(
    tx: Prisma.TransactionClient,
    workspaceId: string,
    id: string,
  ) {
    await tx.$queryRaw`SELECT "id" FROM "PrivateFeedback" WHERE "id"=${id}::uuid AND "workspaceId"=${workspaceId}::uuid FOR UPDATE`;
    const item = await tx.privateFeedback.findFirst({
      where: { id, workspaceId },
      include,
    });
    if (!item) throw new NotFoundException();
    return item;
  }
  async save(
    identity: Identity,
    workspaceId: string,
    id: string,
    body: unknown,
  ) {
    const parsed = inboxPlanSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException();
    const v = parsed.data;
    return this.transaction(identity, workspaceId, async (tx) => {
      // Lock assignee membership before feedback, consistent with the actor membership lock.
      if (v.assigneeId) {
        await tx.$queryRaw`SELECT "userId" FROM "Membership" WHERE "workspaceId"=${workspaceId}::uuid AND "userId"=${v.assigneeId}::uuid FOR SHARE`;
        if (
          !(await tx.membership.findUnique({
            where: {
              workspaceId_userId: { workspaceId, userId: v.assigneeId },
            },
          }))
        )
          throw new BadRequestException();
      }
      const item = await this.lock(tx, workspaceId, id);
      if (item.revision !== v.revision) throw new ConflictException();
      const { revision: _revision, ...data } = v;
      const saved = await tx.privateFeedback.update({
        where: { id },
        data: { ...data, revision: { increment: 1 } },
        include,
      });
      await tx.feedbackActivity.create({
        data: {
          feedbackId: id,
          workspaceId,
          key: randomUUID(),
          kind: 'PLAN',
          body: `${v.status.replaceAll('_', ' ')} · priority ${v.priority.toLowerCase()} · assigned to ${saved.assignee?.displayName || (saved.assigneeId ? 'Team member' : 'Unassigned')} · due ${v.dueDate || 'not set'}${v.resolutionSummary ? ` · ${v.resolutionSummary}` : ''}`.slice(
            0,
            2000,
          ),
          actorId: identity.user.id,
          actorName: (identity.user.displayName || 'Team member').slice(0, 100),
        },
      });
      return this.item(saved);
    });
  }
  async note(
    identity: Identity,
    workspaceId: string,
    id: string,
    body: unknown,
  ) {
    const parsed = inboxNoteSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException();
    return this.transaction(identity, workspaceId, async (tx) => {
      await this.lock(tx, workspaceId, id);
      const prior = await tx.feedbackActivity.findUnique({
        where: { feedbackId_key: { feedbackId: id, key: parsed.data.key } },
      });
      if (prior) {
        if (
          prior.kind !== 'NOTE' ||
          prior.body !== parsed.data.body ||
          prior.actorId !== identity.user.id
        )
          throw new ConflictException();
      } else
        await tx.feedbackActivity.create({
          data: {
            feedbackId: id,
            workspaceId,
            ...parsed.data,
            kind: 'NOTE',
            actorId: identity.user.id,
            actorName: (identity.user.displayName || 'Team member').slice(
              0,
              100,
            ),
          },
        });
      return { message: 'Note saved.' };
    });
  }
}
