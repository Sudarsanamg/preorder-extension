/*
  Warnings:

  - Added the required column `createdAt` to the `CampaignOrders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `CampaignOrders` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `createdAt` on the `PreorderCampaign` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `updatedAt` on the `PreorderCampaign` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `createdAt` on the `PreorderCampaignProduct` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `updatedAt` on the `PreorderCampaignProduct` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `createdAt` on the `Store` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `updatedAt` on the `Store` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `createdAt` on the `VaultedPayment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `updatedAt` on the `VaultedPayment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "CampaignOrders" ADD COLUMN     "createdAt" BIGINT NOT NULL,
ADD COLUMN     "updatedAt" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "PreorderCampaign" DROP COLUMN "createdAt",
ADD COLUMN     "createdAt" BIGINT NOT NULL,
DROP COLUMN "updatedAt",
ADD COLUMN     "updatedAt" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "PreorderCampaignProduct" DROP COLUMN "createdAt",
ADD COLUMN     "createdAt" BIGINT NOT NULL,
DROP COLUMN "updatedAt",
ADD COLUMN     "updatedAt" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "Store" DROP COLUMN "createdAt",
ADD COLUMN     "createdAt" BIGINT NOT NULL,
DROP COLUMN "updatedAt",
ADD COLUMN     "updatedAt" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "VaultedPayment" DROP COLUMN "createdAt",
ADD COLUMN     "createdAt" BIGINT NOT NULL,
DROP COLUMN "updatedAt",
ADD COLUMN     "updatedAt" BIGINT NOT NULL;
