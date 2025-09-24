-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Store" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeID" TEXT NOT NULL,
    "offlineToken" TEXT,
    "webhookRegistered" BOOLEAN NOT NULL DEFAULT false,
    "metaobjectsCreated" BOOLEAN NOT NULL DEFAULT false,
    "metaFieldsCreated" BOOLEAN NOT NULL DEFAULT false,
    "shopifyDomain" TEXT NOT NULL,
    "sendCustomEmail" BOOLEAN NOT NULL DEFAULT false,
    "ConfrimOrderEmailSettings" JSONB,
    "ShippingEmailSettings" JSONB,
    "GeneralSettings" JSONB,
    "EmailConfig" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Store" ("ConfrimOrderEmailSettings", "EmailConfig", "GeneralSettings", "ShippingEmailSettings", "createdAt", "id", "metaFieldsCreated", "metaobjectsCreated", "offlineToken", "shopifyDomain", "storeID", "updatedAt", "webhookRegistered") SELECT "ConfrimOrderEmailSettings", "EmailConfig", "GeneralSettings", "ShippingEmailSettings", "createdAt", "id", "metaFieldsCreated", "metaobjectsCreated", "offlineToken", "shopifyDomain", "storeID", "updatedAt", "webhookRegistered" FROM "Store";
DROP TABLE "Store";
ALTER TABLE "new_Store" RENAME TO "Store";
CREATE UNIQUE INDEX "Store_storeID_key" ON "Store"("storeID");
CREATE UNIQUE INDEX "Store_shopifyDomain_key" ON "Store"("shopifyDomain");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
