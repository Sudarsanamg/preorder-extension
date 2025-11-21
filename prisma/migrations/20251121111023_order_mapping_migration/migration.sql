-- AlterTable
CREATE SEQUENCE ordercampaignmapping_createdat_seq;
CREATE SEQUENCE ordercampaignmapping_updatedat_seq;
ALTER TABLE "OrderCampaignMapping" ALTER COLUMN "createdAt" SET DEFAULT nextval('ordercampaignmapping_createdat_seq'),
ALTER COLUMN "productId" SET DEFAULT 'Invalid product',
ALTER COLUMN "quantity" SET DEFAULT 0,
ALTER COLUMN "updatedAt" SET DEFAULT nextval('ordercampaignmapping_updatedat_seq'),
ALTER COLUMN "variantId" SET DEFAULT 'Invalid variant',
ALTER COLUMN "variantTitle" SET DEFAULT 'Invalid variant title',
ALTER COLUMN "storeId" SET DEFAULT 'Invalid store';
ALTER SEQUENCE ordercampaignmapping_createdat_seq OWNED BY "OrderCampaignMapping"."createdAt";
ALTER SEQUENCE ordercampaignmapping_updatedat_seq OWNED BY "OrderCampaignMapping"."updatedAt";
