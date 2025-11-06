/*
  Warnings:

  - The `campaignType` column on the `PreorderCampaign` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('OUT_OF_STOCK', 'ALLWAYS', 'IN_STOCK');

-- AlterTable
ALTER TABLE "PreorderCampaign" DROP COLUMN "campaignType",
ADD COLUMN     "campaignType" "CampaignType" NOT NULL DEFAULT 'ALLWAYS';
