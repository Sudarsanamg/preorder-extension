-- AlterTable
ALTER TABLE "PreorderCampaign" ALTER COLUMN "shopId" SET DEFAULT 'Invalid shop ID';

-- AlterTable
ALTER TABLE "PreorderCampaignProduct" ADD COLUMN     "storeId" TEXT NOT NULL DEFAULT 'Invalid store';

-- AddForeignKey
ALTER TABLE "PreorderCampaignProduct" ADD CONSTRAINT "PreorderCampaignProduct_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
