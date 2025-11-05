-- AlterTable
ALTER TABLE "CampaignOrders" ALTER COLUMN "campaignId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "VaultedPayment" ALTER COLUMN "campaignId" DROP DEFAULT,
ALTER COLUMN "campaignOrderId" DROP DEFAULT;
