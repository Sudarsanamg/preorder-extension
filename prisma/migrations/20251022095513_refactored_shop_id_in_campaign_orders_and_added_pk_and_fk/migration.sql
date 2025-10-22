/*
  Warnings:

  - Added the required column `shopId` to the `CampaignOrders` table without a default value. This is not possible if the table is not empty.
  - Made the column `storeId` on table `CampaignOrders` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "CampaignOrders" ADD COLUMN     "shopId" TEXT NOT NULL,
ALTER COLUMN "storeId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "CampaignOrders" ADD CONSTRAINT "CampaignOrders_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
