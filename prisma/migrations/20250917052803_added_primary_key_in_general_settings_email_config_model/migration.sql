/*
  Warnings:

  - The required column `id` was added to the `EmailConfig` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `id` was added to the `GeneralSettings` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EmailConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "emailId" TEXT,
    "senderType" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "replyName" TEXT NOT NULL
);
INSERT INTO "new_EmailConfig" ("emailId", "fromName", "replyName", "senderType", "storeId") SELECT "emailId", "fromName", "replyName", "senderType", "storeId" FROM "EmailConfig";
DROP TABLE "EmailConfig";
ALTER TABLE "new_EmailConfig" RENAME TO "EmailConfig";
CREATE UNIQUE INDEX "EmailConfig_id_key" ON "EmailConfig"("id");
CREATE UNIQUE INDEX "EmailConfig_storeId_key" ON "EmailConfig"("storeId");
CREATE TABLE "new_GeneralSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "settings" JSONB NOT NULL
);
INSERT INTO "new_GeneralSettings" ("settings", "storeId") SELECT "settings", "storeId" FROM "GeneralSettings";
DROP TABLE "GeneralSettings";
ALTER TABLE "new_GeneralSettings" RENAME TO "GeneralSettings";
CREATE UNIQUE INDEX "GeneralSettings_id_key" ON "GeneralSettings"("id");
CREATE UNIQUE INDEX "GeneralSettings_storeId_key" ON "GeneralSettings"("storeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
