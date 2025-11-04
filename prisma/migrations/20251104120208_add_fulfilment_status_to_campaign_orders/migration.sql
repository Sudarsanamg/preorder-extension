-- CreateEnum
CREATE TYPE "FulfilementStatus" AS ENUM ('UNFULFILED', 'ONHOLD', 'FULFILLED');

-- AlterTable
ALTER TABLE "CampaignOrders" ADD COLUMN     "fulfilmentStatus" "FulfilementStatus";
