-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PreorderCampaignProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "maxQuantity" INTEGER NOT NULL,
    "soldQuantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PreorderCampaignProduct_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "PreorderCampaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PreorderCampaignProduct" ("campaignId", "createdAt", "id", "maxQuantity", "productId", "soldQuantity", "updatedAt", "variantId") SELECT "campaignId", "createdAt", "id", "maxQuantity", "productId", "soldQuantity", "updatedAt", "variantId" FROM "PreorderCampaignProduct";
DROP TABLE "PreorderCampaignProduct";
ALTER TABLE "new_PreorderCampaignProduct" RENAME TO "PreorderCampaignProduct";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
