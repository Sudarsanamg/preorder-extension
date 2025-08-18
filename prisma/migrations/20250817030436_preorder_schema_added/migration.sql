-- CreateTable
CREATE TABLE "PreorderCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "depositPercent" INTEGER NOT NULL,
    "balanceDueDays" INTEGER NOT NULL,
    "refundDeadlineDays" INTEGER NOT NULL,
    "releaseDate" DATETIME,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PreorderCampaignProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "maxQuantity" INTEGER NOT NULL,
    "soldQuantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PreorderCampaignProduct_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "PreorderCampaign" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Preorder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "customerId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "depositTransactionId" TEXT NOT NULL,
    "depositPaidAt" DATETIME NOT NULL,
    "dueInvoiceSentAt" DATETIME,
    "balanceDueDays" INTEGER NOT NULL,
    "refundDeadlineDays" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Preorder_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "PreorderCampaign" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
