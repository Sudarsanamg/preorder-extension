/*
  Warnings:

  - Made the column `createdAt` on table `OrderCampaignMapping` required. This step will fail if there are existing NULL values in that column.
  - Made the column `price` on table `OrderCampaignMapping` required. This step will fail if there are existing NULL values in that column.
  - Made the column `productId` on table `OrderCampaignMapping` required. This step will fail if there are existing NULL values in that column.
  - Made the column `quantity` on table `OrderCampaignMapping` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `OrderCampaignMapping` required. This step will fail if there are existing NULL values in that column.
  - Made the column `variantId` on table `OrderCampaignMapping` required. This step will fail if there are existing NULL values in that column.
  - Made the column `variantTitle` on table `OrderCampaignMapping` required. This step will fail if there are existing NULL values in that column.
  - Made the column `storeId` on table `OrderCampaignMapping` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable

-- Fix NULL values
-- 1) Fix existing NULL values first
UPDATE "OrderCampaignMapping"
SET 
  "productId"     = COALESCE("productId", 'unknown_product'),
  "variantId"     = COALESCE("variantId", 'unknown_variant'),
  "variantTitle"  = COALESCE("variantTitle", 'Unknown Variant'),
  "quantity"      = COALESCE("quantity", 1),
  "price"         = COALESCE("price", 0),
  "storeId"       = COALESCE("storeId", 'unknown_store'),
  "createdAt"     = COALESCE("createdAt", extract(epoch from now())::bigint),
  "updatedAt"     = COALESCE("updatedAt", extract(epoch from now())::bigint);


-- 2) Now modify columns safely
ALTER TABLE "OrderCampaignMapping"
  ALTER COLUMN "productId" SET NOT NULL,
  ALTER COLUMN "productId" SET DEFAULT 'unknown_product',

  ALTER COLUMN "variantId" SET NOT NULL,
  ALTER COLUMN "variantId" SET DEFAULT 'unknown_variant',

  ALTER COLUMN "variantTitle" SET NOT NULL,
  ALTER COLUMN "variantTitle" SET DEFAULT 'Unknown Variant',

  ALTER COLUMN "quantity" SET NOT NULL,
  ALTER COLUMN "quantity" SET DEFAULT 1,

  ALTER COLUMN "price" SET NOT NULL,
  ALTER COLUMN "price" SET DEFAULT 0,

  ALTER COLUMN "storeId" SET NOT NULL,
  ALTER COLUMN "storeId" SET DEFAULT 'unknown_store',

  ALTER COLUMN "createdAt" SET NOT NULL,
  ALTER COLUMN "createdAt" SET DEFAULT (extract(epoch from now())::bigint),

  ALTER COLUMN "updatedAt" SET NOT NULL,
  ALTER COLUMN "updatedAt" SET DEFAULT (extract(epoch from now())::bigint);
