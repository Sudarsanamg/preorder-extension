-- CreateEnum
CREATE TYPE "Fulfilmentmode" AS ENUM ('ONHOLD', 'UNFULFILED', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "scheduledFulfilmentType" AS ENUM ('DAYS_AFTER', 'EXACT_DATE');

-- AlterTable
ALTER TABLE "PreorderCampaign" ADD COLUMN     "fulfilmentDaysAfter" INTEGER,
ADD COLUMN     "fulfilmentExactDate" TIMESTAMP(3),
ADD COLUMN     "fulfilmentmode" "Fulfilmentmode",
ADD COLUMN     "scheduledFulfilmentType" "scheduledFulfilmentType";
