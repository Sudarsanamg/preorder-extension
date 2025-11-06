-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('NONE', 'FIXED', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'UNPUBLISH');

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaultedPayment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "mandateId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL,
    "accessToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VaultedPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreorderCampaign" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "campaignType" INTEGER NOT NULL DEFAULT 2,
    "depositPercent" INTEGER NOT NULL,
    "balanceDueDate" TIMESTAMP(3) NOT NULL,
    "refundDeadlineDays" INTEGER,
    "releaseDate" TIMESTAMP(3),
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "campaignEndDate" TIMESTAMP(3) NOT NULL,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "orderTags" JSONB,
    "customerTags" JSONB,
    "discountType" "DiscountType" NOT NULL DEFAULT 'NONE',
    "discountPercent" INTEGER,
    "discountFixed" INTEGER,
    "getDueByValt" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreorderCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreorderCampaignProduct" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "variantTitle" TEXT,
    "price" DECIMAL(65,30),
    "imageUrl" TEXT,
    "maxQuantity" INTEGER,
    "soldQuantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreorderCampaignProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignOrders" (
    "id" TEXT NOT NULL,
    "storeId" TEXT,
    "order_number" INTEGER NOT NULL,
    "order_id" TEXT NOT NULL,
    "draft_order_id" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "balanceAmount" INTEGER,
    "paymentStatus" "PaymentStatus" NOT NULL,

    CONSTRAINT "CampaignOrders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Store_storeID_key" ON "Store"("storeID");

-- CreateIndex
CREATE UNIQUE INDEX "Store_shopifyDomain_key" ON "Store"("shopifyDomain");

-- CreateIndex
CREATE UNIQUE INDEX "VaultedPayment_orderId_key" ON "VaultedPayment"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignOrders_order_number_key" ON "CampaignOrders"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignOrders_order_id_key" ON "CampaignOrders"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignOrders_draft_order_id_key" ON "CampaignOrders"("draft_order_id");

-- AddForeignKey
ALTER TABLE "PreorderCampaignProduct" ADD CONSTRAINT "PreorderCampaignProduct_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "PreorderCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
