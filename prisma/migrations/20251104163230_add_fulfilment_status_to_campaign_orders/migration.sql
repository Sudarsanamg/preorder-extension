/*
  Warnings:

  - A unique constraint covering the columns `[storeId,order_id]` on the table `CampaignOrders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[storeId,draft_order_id]` on the table `CampaignOrders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[orderId,storeId]` on the table `VaultedPayment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CampaignOrders_storeId_order_id_key" ON "CampaignOrders"("storeId", "order_id");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignOrders_storeId_draft_order_id_key" ON "CampaignOrders"("storeId", "draft_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "VaultedPayment_orderId_storeId_key" ON "VaultedPayment"("orderId", "storeId");
