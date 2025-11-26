/*
  Warnings:

  - You are about to drop the column `balanceDueDate` on the `PreorderCampaign` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PreorderCampaign" DROP COLUMN "balanceDueDate",
ADD COLUMN     "duePaymentSchedule" JSONB;
