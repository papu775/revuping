ALTER TABLE "Business" ADD COLUMN "draft" JSONB, ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "completedAt" TIMESTAMPTZ(3), ADD COLUMN "logoKey" TEXT;
CREATE UNIQUE INDEX "Business_logoKey_key" ON "Business"("logoKey");
ALTER TABLE "Location" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC', ADD COLUMN "hours" JSONB, ADD COLUMN "isPrimary" BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX "Location_primary_business_key" ON "Location"("businessId") WHERE "isPrimary" = true;
CREATE TABLE "LogoObject" ("key" TEXT PRIMARY KEY, "workspaceId" UUID NOT NULL, "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX "LogoObject_createdAt_idx" ON "LogoObject"("createdAt");
