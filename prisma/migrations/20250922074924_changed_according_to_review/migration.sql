/*
  Warnings:

  - You are about to drop the `DuePayment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Preorder` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "DuePayment_orderID_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DuePayment";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Preorder";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeID" TEXT NOT NULL,
    "offlineToken" TEXT,
    "webhookRegistered" BOOLEAN NOT NULL DEFAULT false,
    "metaobjectsCreated" BOOLEAN NOT NULL DEFAULT false,
    "metaFieldsCreated" BOOLEAN NOT NULL DEFAULT false,
    "shopifyDomain" TEXT NOT NULL,
    "ConfrimOrderEmailSettings" JSONB,
    "ShippingEmailSettings" JSONB,
    "GeneralSettings" JSONB,
    "EmailConfig" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VaultedPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "mandateId" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "accessToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PreorderCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "campaignType" INTEGER NOT NULL DEFAULT 2,
    "depositPercent" INTEGER NOT NULL,
    "balanceDueDate" DATETIME NOT NULL,
    "refundDeadlineDays" INTEGER,
    "releaseDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "campaignEndDate" DATETIME NOT NULL,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "orderTags" JSONB,
    "customerTags" JSONB,
    "discountType" TEXT NOT NULL DEFAULT 'NONE',
    "discountPercent" INTEGER,
    "discountFixed" INTEGER,
    "getDueByValt" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PreorderCampaign" ("balanceDueDate", "campaignEndDate", "campaignType", "createdAt", "customerTags", "depositPercent", "discountFixed", "discountPercent", "discountType", "getDueByValt", "id", "name", "orderTags", "refundDeadlineDays", "releaseDate", "status", "storeId", "totalOrders", "updatedAt") SELECT "balanceDueDate", "campaignEndDate", "campaignType", "createdAt", "customerTags", "depositPercent", "discountFixed", "discountPercent", coalesce("discountType", 'NONE') AS "discountType", "getDueByValt", "id", "name", "orderTags", "refundDeadlineDays", "releaseDate", "status", "storeId", "totalOrders", "updatedAt" FROM "PreorderCampaign";
DROP TABLE "PreorderCampaign";
ALTER TABLE "new_PreorderCampaign" RENAME TO "PreorderCampaign";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Store_storeID_key" ON "Store"("storeID");

-- CreateIndex
CREATE UNIQUE INDEX "Store_shopifyDomain_key" ON "Store"("shopifyDomain");

-- CreateIndex
CREATE UNIQUE INDEX "VaultedPayment_orderId_key" ON "VaultedPayment"("orderId");
