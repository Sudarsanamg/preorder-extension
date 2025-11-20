/*
  Warnings:

  - You are about to drop the column `draft_order_id` on the `CampaignOrders` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[draftOrderId]` on the table `CampaignOrders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[storeId,draftOrderId]` on the table `CampaignOrders` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."CampaignOrders_draft_order_id_key";

-- DropIndex
DROP INDEX "public"."CampaignOrders_storeId_draft_order_id_key";

-- AlterTable
ALTER TABLE "CampaignOrders" DROP COLUMN "draft_order_id",
ADD COLUMN     "draftOrderId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CampaignOrders_draftOrderId_key" ON "CampaignOrders"("draftOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignOrders_storeId_draftOrderId_key" ON "CampaignOrders"("storeId", "draftOrderId");
