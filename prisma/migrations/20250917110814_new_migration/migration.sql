-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" DATETIME,
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false
);

-- CreateTable
CREATE TABLE "DuePayment" (
    "orderID" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "mandateId" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentStatus" TEXT NOT NULL,
    "accessToken" TEXT
);

-- CreateTable
CREATE TABLE "PreorderCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT,
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

-- CreateTable
CREATE TABLE "PreorderCampaignProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "maxQuantity" INTEGER,
    "soldQuantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PreorderCampaignProduct_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "PreorderCampaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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

-- CreateTable
CREATE TABLE "CampaignOrders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT,
    "order_number" INTEGER NOT NULL,
    "order_id" TEXT NOT NULL,
    "draft_order_id" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "balanceAmount" INTEGER,
    "paymentStatus" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "EmailSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "subject" TEXT NOT NULL DEFAULT 'Delivery update for order {order}',
    "font" TEXT NOT NULL DEFAULT 'inherit',
    "storeName" TEXT NOT NULL DEFAULT 'preorderstore',
    "storeNameBold" BOOLEAN NOT NULL DEFAULT true,
    "storeNameColor" TEXT NOT NULL DEFAULT '#333333',
    "storeNameFontSize" TEXT NOT NULL DEFAULT '28',
    "subheading" TEXT NOT NULL DEFAULT 'WE’VE GOT YOUR PREORDER',
    "subheadingFontSize" TEXT NOT NULL DEFAULT '18',
    "subheadingColor" TEXT NOT NULL DEFAULT '#333333',
    "subheadingBold" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT NOT NULL DEFAULT 'Your order {order} contains preorder items. We will deliver them as soon as they become available and will notify you once your order has been shipped.',
    "descriptionFontSize" TEXT NOT NULL DEFAULT '14',
    "descriptionColor" TEXT NOT NULL DEFAULT '#333333',
    "descriptionBold" BOOLEAN NOT NULL DEFAULT false,
    "productTitleFontSize" TEXT NOT NULL DEFAULT '16',
    "productTitleColor" TEXT NOT NULL DEFAULT '#333333',
    "productTitleBold" BOOLEAN NOT NULL DEFAULT true,
    "preorderText" TEXT NOT NULL DEFAULT 'Preorder',
    "fullPaymentText" TEXT NOT NULL DEFAULT 'Full Payment',
    "partialPaymentText" TEXT NOT NULL DEFAULT 'Partial Payment',
    "paymentTextFontSize" TEXT NOT NULL DEFAULT '14',
    "paymentTextColor" TEXT NOT NULL DEFAULT '#333333',
    "paymentTextBold" BOOLEAN NOT NULL DEFAULT false,
    "showCancelButton" BOOLEAN NOT NULL DEFAULT true,
    "cancelButtonStyle" TEXT NOT NULL DEFAULT 'solid',
    "cancelButtonText" TEXT NOT NULL DEFAULT 'Cancel order {order}',
    "cancelButtonFontSize" TEXT NOT NULL DEFAULT '14',
    "cancelButtonTextColor" TEXT NOT NULL DEFAULT '#ffffff',
    "cancelButtonBold" BOOLEAN NOT NULL DEFAULT false,
    "cancelButtonBackgroundColor" TEXT NOT NULL DEFAULT '#757575',
    "cancelButtonBorderSize" TEXT NOT NULL DEFAULT '1',
    "cancelButtonBorderColor" TEXT NOT NULL DEFAULT '#3d3d3d',
    "cancelButtonGradientDegree" TEXT NOT NULL DEFAULT '90',
    "cancelButtonGradientColor1" TEXT NOT NULL DEFAULT '#757575',
    "cancelButtonGradientColor2" TEXT NOT NULL DEFAULT '#a0a0a0',
    "cancelButtonBorderRadius" TEXT NOT NULL DEFAULT '8',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ShippingEmailSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "subject" TEXT NOT NULL DEFAULT 'Delivery update for order {order}',
    "font" TEXT NOT NULL DEFAULT 'inherit',
    "storeName" TEXT NOT NULL DEFAULT 'preorderstore',
    "storeNameBold" BOOLEAN NOT NULL DEFAULT true,
    "storeNameColor" TEXT NOT NULL DEFAULT '#333333',
    "storeNameFontSize" TEXT NOT NULL DEFAULT '28',
    "subheading" TEXT NOT NULL DEFAULT 'WE’VE GOT YOUR PREORDER',
    "subheadingFontSize" TEXT NOT NULL DEFAULT '18',
    "subheadingColor" TEXT NOT NULL DEFAULT '#333333',
    "subheadingBold" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT NOT NULL DEFAULT 'Your order {order} contains preorder items. We will deliver them as soon as they become available and will notify you once your order has been shipped.',
    "descriptionFontSize" TEXT NOT NULL DEFAULT '14',
    "descriptionColor" TEXT NOT NULL DEFAULT '#333333',
    "descriptionBold" BOOLEAN NOT NULL DEFAULT false,
    "productTitleFontSize" TEXT NOT NULL DEFAULT '16',
    "productTitleColor" TEXT NOT NULL DEFAULT '#333333',
    "productTitleBold" BOOLEAN NOT NULL DEFAULT true,
    "preorderText" TEXT NOT NULL DEFAULT 'Preorder',
    "fullPaymentText" TEXT NOT NULL DEFAULT 'Full Payment',
    "partialPaymentText" TEXT NOT NULL DEFAULT 'Partial Payment',
    "paymentTextFontSize" TEXT NOT NULL DEFAULT '14',
    "paymentTextColor" TEXT NOT NULL DEFAULT '#333333',
    "paymentTextBold" BOOLEAN NOT NULL DEFAULT false,
    "showCancelButton" BOOLEAN NOT NULL DEFAULT true,
    "cancelButtonStyle" TEXT NOT NULL DEFAULT 'solid',
    "cancelButtonText" TEXT NOT NULL DEFAULT 'Cancel order {order}',
    "cancelButtonFontSize" TEXT NOT NULL DEFAULT '14',
    "cancelButtonTextColor" TEXT NOT NULL DEFAULT '#ffffff',
    "cancelButtonBold" BOOLEAN NOT NULL DEFAULT false,
    "cancelButtonBackgroundColor" TEXT NOT NULL DEFAULT '#757575',
    "cancelButtonBorderSize" TEXT NOT NULL DEFAULT '1',
    "cancelButtonBorderColor" TEXT NOT NULL DEFAULT '#3d3d3d',
    "cancelButtonGradientDegree" TEXT NOT NULL DEFAULT '90',
    "cancelButtonGradientColor1" TEXT NOT NULL DEFAULT '#757575',
    "cancelButtonGradientColor2" TEXT NOT NULL DEFAULT '#a0a0a0',
    "cancelButtonBorderRadius" TEXT NOT NULL DEFAULT '8',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GeneralSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "settings" JSONB NOT NULL
);

-- CreateTable
CREATE TABLE "EmailConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "emailId" TEXT,
    "senderType" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "replyName" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "DuePayment_orderID_key" ON "DuePayment"("orderID");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignOrders_order_number_key" ON "CampaignOrders"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignOrders_order_id_key" ON "CampaignOrders"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignOrders_draft_order_id_key" ON "CampaignOrders"("draft_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "EmailSettings_shopId_key" ON "EmailSettings"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "ShippingEmailSettings_shopId_key" ON "ShippingEmailSettings"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "GeneralSettings_id_key" ON "GeneralSettings"("id");

-- CreateIndex
CREATE UNIQUE INDEX "GeneralSettings_storeId_key" ON "GeneralSettings"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailConfig_id_key" ON "EmailConfig"("id");

-- CreateIndex
CREATE UNIQUE INDEX "EmailConfig_storeId_key" ON "EmailConfig"("storeId");
