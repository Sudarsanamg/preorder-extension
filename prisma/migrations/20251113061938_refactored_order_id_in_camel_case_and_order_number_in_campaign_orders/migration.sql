/*
  Warnings:

  - You are about to drop the column `order_id` on the `CampaignOrders` table. All the data in the column will be lost.
  - You are about to drop the column `order_number` on the `CampaignOrders` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[orderId]` on the table `CampaignOrders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[storeId,orderId]` on the table `CampaignOrders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `orderId` to the `CampaignOrders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orderNumber` to the `CampaignOrders` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."CampaignOrders_order_id_key";

-- DropIndex
DROP INDEX "public"."CampaignOrders_storeId_order_id_key";

-- AlterTable
ALTER TABLE "CampaignOrders" DROP COLUMN "order_id",
DROP COLUMN "order_number",
ADD COLUMN     "orderId" TEXT NOT NULL,
ADD COLUMN     "orderNumber" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CampaignOrders_orderId_key" ON "CampaignOrders"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignOrders_storeId_orderId_key" ON "CampaignOrders"("storeId", "orderId");
