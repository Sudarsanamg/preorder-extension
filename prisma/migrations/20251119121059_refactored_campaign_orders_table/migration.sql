/*
  Warnings:

  - You are about to drop the column `campaignId` on the `CampaignOrders` table. All the data in the column will be lost.
  - You are about to drop the column `refundDeadlineDays` on the `PreorderCampaign` table. All the data in the column will be lost.
  - You are about to drop the column `releaseDate` on the `PreorderCampaign` table. All the data in the column will be lost.
  - You are about to drop the column `metaFieldsCreated` on the `Store` table. All the data in the column will be lost.
  - You are about to drop the column `metaobjectsCreated` on the `Store` table. All the data in the column will be lost.
  - You are about to drop the column `webhookRegistered` on the `Store` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."CampaignOrders" DROP CONSTRAINT "CampaignOrders_campaignId_fkey";

-- AlterTable
ALTER TABLE "CampaignOrders" DROP COLUMN "campaignId";

-- AlterTable
ALTER TABLE "PreorderCampaign" DROP COLUMN "refundDeadlineDays",
DROP COLUMN "releaseDate";

-- AlterTable
ALTER TABLE "Store" DROP COLUMN "metaFieldsCreated",
DROP COLUMN "metaobjectsCreated",
DROP COLUMN "webhookRegistered";

-- CreateTable
CREATE TABLE "OrderCampaignMapping" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,

    CONSTRAINT "OrderCampaignMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderCampaignMapping_orderId_campaignId_key" ON "OrderCampaignMapping"("orderId", "campaignId");

-- AddForeignKey
ALTER TABLE "OrderCampaignMapping" ADD CONSTRAINT "OrderCampaignMapping_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CampaignOrders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCampaignMapping" ADD CONSTRAINT "OrderCampaignMapping_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "PreorderCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
