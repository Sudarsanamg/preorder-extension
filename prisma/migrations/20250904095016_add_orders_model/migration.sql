-- CreateTable
CREATE TABLE "CampaignOrders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_number" INTEGER NOT NULL,
    "order_id" TEXT NOT NULL,
    "draft_order_id" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "balanceAmount" INTEGER NOT NULL,
    "paymentStatus" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PreorderCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "depositPercent" INTEGER NOT NULL,
    "balanceDueDate" DATETIME NOT NULL,
    "refundDeadlineDays" INTEGER,
    "releaseDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "campaignEndDate" DATETIME NOT NULL,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PreorderCampaign" ("balanceDueDate", "campaignEndDate", "createdAt", "depositPercent", "id", "name", "refundDeadlineDays", "releaseDate", "status", "totalOrders", "updatedAt") SELECT "balanceDueDate", "campaignEndDate", "createdAt", "depositPercent", "id", "name", "refundDeadlineDays", "releaseDate", "status", "totalOrders", "updatedAt" FROM "PreorderCampaign";
DROP TABLE "PreorderCampaign";
ALTER TABLE "new_PreorderCampaign" RENAME TO "PreorderCampaign";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
