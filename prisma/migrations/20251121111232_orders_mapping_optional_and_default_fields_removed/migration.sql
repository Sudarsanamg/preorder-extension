-- AlterTable
ALTER TABLE "OrderCampaignMapping" ALTER COLUMN "createdAt" DROP DEFAULT,
ALTER COLUMN "price" DROP DEFAULT,
ALTER COLUMN "productId" DROP DEFAULT,
ALTER COLUMN "quantity" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "variantId" DROP DEFAULT,
ALTER COLUMN "variantTitle" DROP DEFAULT,
ALTER COLUMN "storeId" DROP DEFAULT;
DROP SEQUENCE "ordercampaignmapping_createdat_seq";
DROP SEQUENCE "ordercampaignmapping_updatedat_seq";
