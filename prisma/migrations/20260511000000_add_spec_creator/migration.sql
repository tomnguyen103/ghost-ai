-- AlterTable
ALTER TABLE "ProjectSpec" ADD COLUMN "creatorId" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "ProjectSpec_creatorId_idx" ON "ProjectSpec"("creatorId");
