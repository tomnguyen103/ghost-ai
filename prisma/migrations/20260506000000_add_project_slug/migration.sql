-- AlterTable: add slug column as nullable first for backfill
ALTER TABLE "Project" ADD COLUMN "slug" TEXT;

-- Backfill: generate slug from name + last 8 chars of id
UPDATE "Project"
SET "slug" = CASE
  WHEN REGEXP_REPLACE(LOWER(REGEXP_REPLACE("name", '[^a-zA-Z0-9]+', '-', 'g')), '^-+|-+$', '', 'g') = ''
  THEN 'project-' || LOWER(SUBSTRING("id", LENGTH("id") - 7))
  ELSE REGEXP_REPLACE(LOWER(REGEXP_REPLACE("name", '[^a-zA-Z0-9]+', '-', 'g')), '^-+|-+$', '', 'g') || '-' || LOWER(SUBSTRING("id", LENGTH("id") - 7))
END;

-- Make NOT NULL and add unique index
ALTER TABLE "Project" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");
