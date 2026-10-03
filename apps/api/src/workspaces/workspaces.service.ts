import { ForbiddenException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../infrastructure/database.service';
import { AuthService, type Identity } from '../auth/auth.service';
import type { CreateWorkspaceDto, UpdateWorkspaceDto } from './workspaces.dto';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly database: DatabaseService,
    private readonly auth: AuthService,
  ) {}
  async list(identity: Identity) {
    return this.auth.available(async () => {
      const memberships = await this.database.client.membership.findMany({
        where: { userId: identity.user.id },
        include: { workspace: true },
        orderBy: { createdAt: 'asc' },
      });
      return memberships.map(({ workspace, role }) => ({
        id: workspace.id,
        name: workspace.name,
        role,
      }));
    });
  }
  async create(identity: Identity, input: CreateWorkspaceDto) {
    return this.auth.available(() =>
      this.database.client.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${identity.user.id}::uuid FOR UPDATE`;
        const previous = await tx.workspaceCreation.findUnique({
          where: { userId_key: { userId: identity.user.id, key: input.key } },
          include: { workspace: true },
        });
        if (previous) {
          const membership = await tx.membership.findUnique({
            where: {
              workspaceId_userId: {
                workspaceId: previous.workspaceId,
                userId: identity.user.id,
              },
            },
          });
          if (!membership) throw new ForbiddenException();
          return {
            id: previous.workspace.id,
            name: previous.workspace.name,
            role: membership.role,
          };
        }
        const workspace = await tx.workspace.create({
          data: {
            name: input.name,
            memberships: {
              create: { userId: identity.user.id, role: 'OWNER' },
            },
          },
        });
        await tx.workspaceCreation.create({
          data: {
            userId: identity.user.id,
            key: input.key,
            workspaceId: workspace.id,
          },
        });
        return {
          id: workspace.id,
          name: workspace.name,
          role: 'OWNER' as const,
        };
      }),
    );
  }
  async read(identity: Identity, workspaceId: string) {
    return this.auth.available(async () => {
      const membership = await this.database.client.membership.findUnique({
        where: {
          workspaceId_userId: { workspaceId, userId: identity.user.id },
        },
        include: { workspace: true },
      });
      if (!membership) throw new ForbiddenException();
      return {
        id: membership.workspace.id,
        name: membership.workspace.name,
        role: membership.role,
      };
    });
  }
  async update(
    identity: Identity,
    workspaceId: string,
    input: UpdateWorkspaceDto,
  ) {
    return this.auth.available(() =>
      this.database.client.$transaction(async (tx) => {
        // Lock the membership used for authorization for the whole mutation.
        await tx.$queryRaw`SELECT "userId" FROM "Membership" WHERE "workspaceId" = ${workspaceId}::uuid AND "userId" = ${identity.user.id}::uuid FOR UPDATE`;
        const membership = await tx.membership.findUnique({
          where: {
            workspaceId_userId: { workspaceId, userId: identity.user.id },
          },
        });
        if (membership?.role !== 'OWNER') throw new ForbiddenException();
        const workspace = await tx.workspace.update({
          where: { id: workspaceId },
          data: { name: input.name },
        });
        return {
          id: workspace.id,
          name: workspace.name,
          role: membership.role,
        };
      }),
    );
  }
}
