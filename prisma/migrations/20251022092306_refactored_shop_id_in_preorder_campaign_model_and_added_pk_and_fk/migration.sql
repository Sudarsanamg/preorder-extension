-- AlterTable
ALTER TABLE "PreorderCampaign" ADD COLUMN     "shopId" TEXT NOT NULL DEFAULT 'Invalid store ID';

-- AlterTable
ALTER TABLE "VaultedPayment" ALTER COLUMN "storeDomain" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "PreorderCampaign" ADD CONSTRAINT "PreorderCampaign_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
