/*
  Warnings:

  - You are about to drop the column `topic` on the `Publication` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'AI_COMMENTATOR';

-- AlterTable
ALTER TABLE "Publication" DROP COLUMN "topic";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "aiActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "aiCommentDelay" INTEGER NOT NULL DEFAULT 5000,
ADD COLUMN     "aiPrompt" TEXT,
ADD COLUMN     "isAiAccount" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Like" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Like_publicationId_idx" ON "Like"("publicationId");

-- CreateIndex
CREATE INDEX "Like_userId_idx" ON "Like"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Like_publicationId_userId_key" ON "Like"("publicationId", "userId");

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
