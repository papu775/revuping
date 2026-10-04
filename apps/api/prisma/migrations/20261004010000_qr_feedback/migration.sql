ALTER TABLE "Location" ADD COLUMN "publicId" UUID NOT NULL DEFAULT gen_random_uuid(), ADD COLUMN "customerEnabled" BOOLEAN NOT NULL DEFAULT true, ADD COLUMN "qrRevision" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "qrDisplayName" VARCHAR(100) NOT NULL DEFAULT '', ADD COLUMN "qrDisplayText" VARCHAR(120) NOT NULL DEFAULT 'How was your visit?', ADD COLUMN "qrBrandColor" VARCHAR(7), ADD COLUMN "qrLayout" TEXT NOT NULL DEFAULT 'Counter card', ADD COLUMN "googleReviewUrl" VARCHAR(500);
CREATE UNIQUE INDEX "Location_publicId_key" ON "Location"("publicId");
CREATE UNIQUE INDEX "Location_id_workspaceId_key" ON "Location"("id", "workspaceId");
ALTER TABLE "Location" ADD CONSTRAINT "Location_qr_settings_check" CHECK ("qrRevision" >= 0 AND "qrLayout" IN ('Counter card', 'Minimal poster') AND ("qrBrandColor" IS NULL OR "qrBrandColor" ~ '^#[0-9a-fA-F]{6}$'));
CREATE TABLE "PrivateFeedback" (
 "id" UUID PRIMARY KEY, "workspaceId" UUID NOT NULL REFERENCES "Workspace"("id") ON DELETE CASCADE,
 "locationId" UUID NOT NULL, "submissionKey" UUID NOT NULL, "payloadHash" CHAR(64) NOT NULL,
 "rating" INTEGER NOT NULL CHECK ("rating" BETWEEN 1 AND 5), "message" VARCHAR(2000) NOT NULL CHECK (length(trim("message")) > 0), "name" VARCHAR(100), "email" VARCHAR(254), "status" TEXT NOT NULL DEFAULT 'UNRESOLVED' CHECK ("status" IN ('UNRESOLVED', 'RESOLVED')), "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY ("locationId", "workspaceId") REFERENCES "Location"("id", "workspaceId") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "PrivateFeedback_locationId_submissionKey_key" ON "PrivateFeedback"("locationId", "submissionKey");
CREATE INDEX "PrivateFeedback_workspaceId_createdAt_idx" ON "PrivateFeedback"("workspaceId", "createdAt");
CREATE INDEX "PrivateFeedback_locationId_status_createdAt_idx" ON "PrivateFeedback"("locationId", "status", "createdAt");
