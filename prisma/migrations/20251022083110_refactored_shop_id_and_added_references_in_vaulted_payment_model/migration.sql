/*
  Warnings:

  - You are about to drop the column `storeID` on the `Store` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[shopId]` on the table `Store` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `shopId` to the `Store` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storeId` to the `VaultedPayment` table without a default value. This is not possible if the table is not empty.
  - Made the column `storeDomain` on table `VaultedPayment` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "public"."Store_storeID_key";

-- AlterTable
ALTER TABLE "Store" DROP COLUMN "storeID",
ADD COLUMN     "shopId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "VaultedPayment" ADD COLUMN     "storeId" TEXT NOT NULL,
ALTER COLUMN "storeDomain" SET NOT NULL,
ALTER COLUMN "storeDomain" SET DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "Store_shopId_key" ON "Store"("shopId");

-- AddForeignKey
ALTER TABLE "VaultedPayment" ADD CONSTRAINT "VaultedPayment_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
