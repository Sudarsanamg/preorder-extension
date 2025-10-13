-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "appInstalled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "currencyCode" TEXT NOT NULL DEFAULT 'USD';
