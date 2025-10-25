/*
  Warnings:

  - A unique constraint covering the columns `[draft_order_id]` on the table `CampaignOrders` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CampaignOrders_draft_order_id_key" ON "CampaignOrders"("draft_order_id");
