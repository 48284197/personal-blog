-- AlterTable
ALTER TABLE "AiGatewayProvider" ADD COLUMN IF NOT EXISTS "balanceInsufficient" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AiGatewayProvider" ADD COLUMN IF NOT EXISTS "balanceInsufficientAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AiGatewayProvider_isActive_balanceInsufficient_priority_idx" ON "AiGatewayProvider"("isActive", "balanceInsufficient", "priority");
