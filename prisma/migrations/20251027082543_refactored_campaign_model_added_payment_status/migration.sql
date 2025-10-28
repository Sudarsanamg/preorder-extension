-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('FULLPAYMENT', 'PARTIALPAYMENT');

-- AlterTable
ALTER TABLE "PreorderCampaign" ADD COLUMN     "paymentType" "PaymentMode",
ALTER COLUMN "depositPercent" DROP NOT NULL,
ALTER COLUMN "balanceDueDate" DROP NOT NULL;
