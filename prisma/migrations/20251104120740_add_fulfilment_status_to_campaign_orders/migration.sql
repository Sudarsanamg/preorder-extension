/*
  Warnings:

  - The `fulfilmentStatus` column on the `CampaignOrders` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "FulfillmentStatus" AS ENUM ('UNFULFILLED', 'ON_HOLD', 'FULFILLED');

-- AlterTable
ALTER TABLE "CampaignOrders" DROP COLUMN "fulfilmentStatus",
ADD COLUMN     "fulfilmentStatus" "FulfillmentStatus";

-- DropEnum
DROP TYPE "public"."FulfilementStatus";
