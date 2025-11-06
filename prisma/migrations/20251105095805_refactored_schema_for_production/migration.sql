/*
  Warnings:

  - You are about to drop the column `campaignId` on the `VaultedPayment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[campaignOrderId]` on the table `VaultedPayment` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."VaultedPayment" DROP CONSTRAINT "VaultedPayment_campaignId_fkey";

-- AlterTable
ALTER TABLE "VaultedPayment" DROP COLUMN "campaignId";

-- CreateIndex
CREATE UNIQUE INDEX "VaultedPayment_campaignOrderId_key" ON "VaultedPayment"("campaignOrderId");
