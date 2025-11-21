-- AlterTable
ALTER TABLE "OrderCampaignMapping" ADD COLUMN     "createdAt" BIGINT,
ADD COLUMN     "price" DECIMAL(65,30),
ADD COLUMN     "productId" TEXT,
ADD COLUMN     "quantity" INTEGER,
ADD COLUMN     "updatedAt" BIGINT,
ADD COLUMN     "variantId" TEXT,
ADD COLUMN     "variantTitle" TEXT;
