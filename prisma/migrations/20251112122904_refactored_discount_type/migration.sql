/*
  Warnings:

  - You are about to drop the column `discountFixed` on the `PreorderCampaign` table. All the data in the column will be lost.
  - You are about to drop the column `discountPercent` on the `PreorderCampaign` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PreorderCampaign" DROP COLUMN "discountFixed",
DROP COLUMN "discountPercent",
ADD COLUMN     "discountValue" DOUBLE PRECISION;
