-- AlterTable
ALTER TABLE "PreorderCampaign" ADD COLUMN "storeId" TEXT;

-- CreateTable
CREATE TABLE "GeneralSettings" (
    "storeId" TEXT NOT NULL,
    "settings" JSONB NOT NULL
);

-- CreateTable
CREATE TABLE "EmailConfig" (
    "storeId" TEXT NOT NULL,
    "emailId" TEXT,
    "senderType" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "replyName" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "GeneralSettings_storeId_key" ON "GeneralSettings"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailConfig_storeId_key" ON "EmailConfig"("storeId");
