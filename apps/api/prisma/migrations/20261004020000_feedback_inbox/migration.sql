ALTER TABLE "PrivateFeedback" DROP CONSTRAINT "PrivateFeedback_status_check";
ALTER TABLE "PrivateFeedback"
 ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0 CHECK ("revision" >= 0),
 ADD COLUMN "assigneeId" UUID REFERENCES "User"("id") ON DELETE SET NULL,
 ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'NORMAL' CHECK ("priority" IN ('LOW','NORMAL','HIGH')),
 ADD COLUMN "dueDate" VARCHAR(10) NOT NULL DEFAULT '',
 ADD COLUMN "tags" VARCHAR(100) NOT NULL DEFAULT '',
 ADD COLUMN "resolutionSummary" VARCHAR(2000) NOT NULL DEFAULT '',
 ADD COLUMN "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 ADD CONSTRAINT "PrivateFeedback_status_check" CHECK ("status" IN ('UNRESOLVED','IN_PROGRESS','RESOLVED'));
CREATE UNIQUE INDEX "PrivateFeedback_id_workspaceId_key" ON "PrivateFeedback"("id","workspaceId");
CREATE TABLE "FeedbackActivity" (
 "id" UUID PRIMARY KEY, "feedbackId" UUID NOT NULL, "workspaceId" UUID NOT NULL REFERENCES "Workspace"("id") ON DELETE CASCADE,
 "key" UUID NOT NULL, "kind" TEXT NOT NULL CHECK ("kind" IN ('NOTE','PLAN')),
 "body" VARCHAR(2000) NOT NULL CHECK (length(trim("body")) > 0),
 "actorId" UUID NOT NULL, "actorName" VARCHAR(100) NOT NULL, "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY ("feedbackId","workspaceId") REFERENCES "PrivateFeedback"("id","workspaceId") ON DELETE CASCADE,
 UNIQUE ("feedbackId","key")
);
CREATE INDEX "FeedbackActivity_workspaceId_feedbackId_createdAt_idx" ON "FeedbackActivity"("workspaceId","feedbackId","createdAt");
