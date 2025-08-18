-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PreorderCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "depositPercent" INTEGER NOT NULL,
    "balanceDueDays" INTEGER NOT NULL,
    "refundDeadlineDays" INTEGER,
    "releaseDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PreorderCampaign" ("balanceDueDays", "createdAt", "depositPercent", "id", "name", "refundDeadlineDays", "releaseDate", "status", "updatedAt") SELECT "balanceDueDays", "createdAt", "depositPercent", "id", "name", "refundDeadlineDays", "releaseDate", "status", "updatedAt" FROM "PreorderCampaign";
DROP TABLE "PreorderCampaign";
ALTER TABLE "new_PreorderCampaign" RENAME TO "PreorderCampaign";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
