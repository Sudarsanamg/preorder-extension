/*
  Warnings:

  - You are about to drop the column `getDueByValt` on the `PreorderCampaign` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PreorderCampaign" DROP COLUMN "getDueByValt";

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "getDueByVault" BOOLEAN NOT NULL DEFAULT false;
