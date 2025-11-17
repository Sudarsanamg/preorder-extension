/*
  Warnings:

  - The values [ALLWAYS] on the enum `CampaignType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CampaignType_new" AS ENUM ('OUT_OF_STOCK', 'ALWAYS', 'IN_STOCK');
ALTER TABLE "public"."PreorderCampaign" ALTER COLUMN "campaignType" DROP DEFAULT;
ALTER TABLE "PreorderCampaign" ALTER COLUMN "campaignType" TYPE "CampaignType_new" USING ("campaignType"::text::"CampaignType_new");
ALTER TYPE "CampaignType" RENAME TO "CampaignType_old";
ALTER TYPE "CampaignType_new" RENAME TO "CampaignType";
DROP TYPE "public"."CampaignType_old";
ALTER TABLE "PreorderCampaign" ALTER COLUMN "campaignType" SET DEFAULT 'ALWAYS';
COMMIT;

-- AlterTable
ALTER TABLE "PreorderCampaign" ALTER COLUMN "campaignType" SET DEFAULT 'ALWAYS';
