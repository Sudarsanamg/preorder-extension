/*
  Warnings:

  - Made the column `variantId` on table `PreorderCampaignProduct` required. This step will fail if there are existing NULL values in that column.
  - Made the column `variantTitle` on table `PreorderCampaignProduct` required. This step will fail if there are existing NULL values in that column.
  - Made the column `price` on table `PreorderCampaignProduct` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "PreorderCampaignProduct" ALTER COLUMN "variantId" SET NOT NULL,
ALTER COLUMN "variantTitle" SET NOT NULL,
ALTER COLUMN "price" SET NOT NULL;
