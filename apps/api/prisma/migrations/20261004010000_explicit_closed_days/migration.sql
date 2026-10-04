-- Empty legacy intervals remain unknown, never inferred as closed.
ALTER TABLE "Location" ADD COLUMN "closedDays" JSONB;
