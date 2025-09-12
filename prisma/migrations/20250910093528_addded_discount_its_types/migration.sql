-- AlterTable
ALTER TABLE "PreorderCampaign" ADD COLUMN "discountFixed" INTEGER;
ALTER TABLE "PreorderCampaign" ADD COLUMN "discountPercent" INTEGER;
ALTER TABLE "PreorderCampaign" ADD COLUMN "discountType" TEXT DEFAULT 'none';
