-- CreateEnum
CREATE TYPE "AiGatewayRouteStrategy" AS ENUM ('DEFAULT', 'MODEL_PREFIX');

-- CreateTable
CREATE TABLE "AiGatewayProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "routeStrategy" "AiGatewayRouteStrategy" NOT NULL DEFAULT 'DEFAULT',
    "modelPrefix" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiGatewayProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiGatewayModel" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "publicModel" TEXT NOT NULL,
    "upstreamModel" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiGatewayModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiGatewayKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiGatewayKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiGatewayProvider_isActive_priority_idx" ON "AiGatewayProvider"("isActive", "priority");

-- CreateIndex
CREATE INDEX "AiGatewayModel_publicModel_isActive_idx" ON "AiGatewayModel"("publicModel", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AiGatewayModel_providerId_publicModel_key" ON "AiGatewayModel"("providerId", "publicModel");

-- CreateIndex
CREATE UNIQUE INDEX "AiGatewayKey_keyHash_key" ON "AiGatewayKey"("keyHash");

-- CreateIndex
CREATE INDEX "AiGatewayKey_isActive_idx" ON "AiGatewayKey"("isActive");

-- AddForeignKey
ALTER TABLE "AiGatewayModel" ADD CONSTRAINT "AiGatewayModel_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "AiGatewayProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
