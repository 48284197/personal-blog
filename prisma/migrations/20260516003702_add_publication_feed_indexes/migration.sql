CREATE INDEX "Publication_channel_publishedAt_createdAt_idx"
ON "Publication"("channel", "publishedAt" DESC, "createdAt" DESC);

CREATE INDEX "Publication_publishedAt_createdAt_idx"
ON "Publication"("publishedAt" DESC, "createdAt" DESC);
