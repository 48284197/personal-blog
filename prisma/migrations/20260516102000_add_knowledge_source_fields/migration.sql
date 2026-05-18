ALTER TABLE "KnowledgeItem"
ADD COLUMN IF NOT EXISTS "sourceUrl" TEXT,
ADD COLUMN IF NOT EXISTS "sourcePlatform" TEXT,
ADD COLUMN IF NOT EXISTS "sourceAuthorName" TEXT,
ADD COLUMN IF NOT EXISTS "sourceAuthorAvatar" TEXT,
ADD COLUMN IF NOT EXISTS "sourceTitle" TEXT,
ADD COLUMN IF NOT EXISTS "sourceCoverUrl" TEXT;

CREATE INDEX IF NOT EXISTS "KnowledgeItem_sourcePlatform_createdAt_idx" ON "KnowledgeItem"("sourcePlatform", "createdAt");
CREATE INDEX IF NOT EXISTS "KnowledgeItem_authorId_createdAt_idx" ON "KnowledgeItem"("authorId", "createdAt");
