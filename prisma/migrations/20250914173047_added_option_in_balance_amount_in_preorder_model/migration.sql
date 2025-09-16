-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CampaignOrders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_number" INTEGER NOT NULL,
    "order_id" TEXT NOT NULL,
    "draft_order_id" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "balanceAmount" INTEGER,
    "paymentStatus" TEXT NOT NULL
);
INSERT INTO "new_CampaignOrders" ("balanceAmount", "draft_order_id", "dueDate", "id", "order_id", "order_number", "paymentStatus") SELECT "balanceAmount", "draft_order_id", "dueDate", "id", "order_id", "order_number", "paymentStatus" FROM "CampaignOrders";
DROP TABLE "CampaignOrders";
ALTER TABLE "new_CampaignOrders" RENAME TO "CampaignOrders";
CREATE UNIQUE INDEX "CampaignOrders_order_number_key" ON "CampaignOrders"("order_number");
CREATE UNIQUE INDEX "CampaignOrders_draft_order_id_key" ON "CampaignOrders"("draft_order_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
