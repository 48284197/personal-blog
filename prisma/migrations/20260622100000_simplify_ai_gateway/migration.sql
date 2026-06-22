-- DropForeignKey
ALTER TABLE "AiGatewayModel" DROP CONSTRAINT IF EXISTS "AiGatewayModel_providerId_fkey";

-- DropTable
DROP TABLE IF EXISTS "AiGatewayModel";

-- AlterTable
ALTER TABLE "AiGatewayProvider" DROP COLUMN IF EXISTS "routeStrategy";
ALTER TABLE "AiGatewayProvider" DROP COLUMN IF EXISTS "modelPrefix";

-- DropEnum
DROP TYPE IF EXISTS "AiGatewayRouteStrategy";
