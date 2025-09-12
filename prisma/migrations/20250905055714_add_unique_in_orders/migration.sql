/*
  Warnings:

  - A unique constraint covering the columns `[order_number]` on the table `CampaignOrders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[draft_order_id]` on the table `CampaignOrders` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CampaignOrders_order_number_key" ON "CampaignOrders"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignOrders_draft_order_id_key" ON "CampaignOrders"("draft_order_id");
