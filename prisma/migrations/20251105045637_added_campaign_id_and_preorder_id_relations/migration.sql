-- AlterTable
ALTER TABLE "CampaignOrders" ADD COLUMN     "campaignId" TEXT NOT NULL DEFAULT 'unknown';

-- AlterTable
ALTER TABLE "VaultedPayment" ADD COLUMN     "campaignId" TEXT NOT NULL DEFAULT 'unknown',
ADD COLUMN     "campaignOrderId" TEXT NOT NULL DEFAULT 'unknown';

-- AddForeignKey
ALTER TABLE "VaultedPayment" ADD CONSTRAINT "VaultedPayment_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "PreorderCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaultedPayment" ADD CONSTRAINT "VaultedPayment_campaignOrderId_fkey" FOREIGN KEY ("campaignOrderId") REFERENCES "CampaignOrders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignOrders" ADD CONSTRAINT "CampaignOrders_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "PreorderCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
