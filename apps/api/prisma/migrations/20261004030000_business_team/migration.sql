ALTER TABLE "Membership" ADD COLUMN revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0);
ALTER TABLE "Location" ADD COLUMN "creationKey" UUID;
CREATE UNIQUE INDEX "Location_workspaceId_creationKey_key" ON "Location"("workspaceId","creationKey");
ALTER TABLE "Location" ADD COLUMN "detailsRevision" INTEGER NOT NULL DEFAULT 0 CHECK ("detailsRevision" >= 0), ADD COLUMN "archivedAt" TIMESTAMPTZ(3);
CREATE TABLE "WorkspaceSettings" (
 "workspaceId" UUID PRIMARY KEY REFERENCES "Workspace"(id) ON DELETE CASCADE, "revision" INTEGER NOT NULL DEFAULT 0 CHECK ("revision" >= 0),
 weekly BOOLEAN NOT NULL DEFAULT false, feedback BOOLEAN NOT NULL DEFAULT false, reminders BOOLEAN NOT NULL DEFAULT false,
 "requestTemplate" VARCHAR(2000) NOT NULL DEFAULT 'Hi {name}, thanks for visiting. Share your experience: {link}',
 "rebookingTemplate" VARCHAR(2000) NOT NULL DEFAULT 'Hi {name}, ready for another visit? {link}'
);
CREATE TABLE "TeamInvitation" (
 id UUID PRIMARY KEY, "workspaceId" UUID NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
 key UUID NOT NULL, email CITEXT NOT NULL, name VARCHAR(100) NOT NULL, role "MembershipRole" NOT NULL DEFAULT 'STAFF',
 "createdBy" UUID NOT NULL, "tokenHash" CHAR(64) UNIQUE, "expiresAt" TIMESTAMPTZ(3) NOT NULL,
 "acceptedAt" TIMESTAMPTZ(3), "acceptedBy" UUID, "revokedAt" TIMESTAMPTZ(3), delivery TEXT NOT NULL DEFAULT 'PENDING' CHECK (delivery IN ('PENDING','SENT','FAILED')),
 revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0), "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE ("workspaceId",key)
);
CREATE INDEX "TeamInvitation_workspaceId_createdAt_idx" ON "TeamInvitation"("workspaceId","createdAt");
CREATE UNIQUE INDEX "TeamInvitation_pending_email_key" ON "TeamInvitation"("workspaceId",email) WHERE "acceptedAt" IS NULL AND "revokedAt" IS NULL;
