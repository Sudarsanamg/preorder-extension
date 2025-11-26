/*
  Warnings:

  - You are about to drop the column `fulfilmentDaysAfter` on the `PreorderCampaign` table. All the data in the column will be lost.
  - You are about to drop the column `fulfilmentExactDate` on the `PreorderCampaign` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledFulfilmentType` on the `PreorderCampaign` table. All the data in the column will be lost.
  - You are about to alter the column `discountValue` on the `PreorderCampaign` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to drop the column `EmailConfig` on the `Store` table. All the data in the column will be lost.
  - You are about to drop the column `GeneralSettings` on the `Store` table. All the data in the column will be lost.
  - Made the column `currency` on table `CampaignOrders` required. This step will fail if there are existing NULL values in that column.
  - Made the column `totalAmount` on table `CampaignOrders` required. This step will fail if there are existing NULL values in that column.
  - Made the column `offlineToken` on table `Store` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "CampaignOrders" ALTER COLUMN "currency" SET NOT NULL,
ALTER COLUMN "totalAmount" SET NOT NULL;

-- AlterTable
ALTER TABLE "OrderCampaignMapping" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "PreorderCampaign" DROP COLUMN "fulfilmentDaysAfter",
DROP COLUMN "fulfilmentExactDate",
DROP COLUMN "scheduledFulfilmentType",
ADD COLUMN     "fulfilmentSchedule" JSONB,
ALTER COLUMN "discountValue" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Store" DROP COLUMN "EmailConfig",
DROP COLUMN "GeneralSettings",
ALTER COLUMN "offlineToken" SET NOT NULL;
