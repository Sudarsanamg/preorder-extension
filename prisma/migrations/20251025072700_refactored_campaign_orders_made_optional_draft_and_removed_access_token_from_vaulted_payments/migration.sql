/*
  Warnings:

  - You are about to drop the column `accessToken` on the `VaultedPayment` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."CampaignOrders_draft_order_id_key";

-- AlterTable
ALTER TABLE "CampaignOrders" ALTER COLUMN "draft_order_id" DROP NOT NULL,
ALTER COLUMN "dueDate" DROP NOT NULL;

-- AlterTable
ALTER TABLE "VaultedPayment" DROP COLUMN "accessToken";
