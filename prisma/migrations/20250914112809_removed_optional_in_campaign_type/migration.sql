-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PreorderCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "campaignType" INTEGER NOT NULL DEFAULT 2,
    "depositPercent" INTEGER NOT NULL,
    "balanceDueDate" DATETIME NOT NULL,
    "refundDeadlineDays" INTEGER,
    "releaseDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "campaignEndDate" DATETIME NOT NULL,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "orderTags" JSONB,
    "customerTags" JSONB,
    "discountType" TEXT DEFAULT 'none',
    "discountPercent" INTEGER,
    "discountFixed" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PreorderCampaign" ("balanceDueDate", "campaignEndDate", "campaignType", "createdAt", "customerTags", "depositPercent", "discountFixed", "discountPercent", "discountType", "id", "name", "orderTags", "refundDeadlineDays", "releaseDate", "status", "totalOrders", "updatedAt") SELECT "balanceDueDate", "campaignEndDate", coalesce("campaignType", 2) AS "campaignType", "createdAt", "customerTags", "depositPercent", "discountFixed", "discountPercent", "discountType", "id", "name", "orderTags", "refundDeadlineDays", "releaseDate", "status", "totalOrders", "updatedAt" FROM "PreorderCampaign";
DROP TABLE "PreorderCampaign";
ALTER TABLE "new_PreorderCampaign" RENAME TO "PreorderCampaign";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
