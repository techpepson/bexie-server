/*
  Warnings:

  - You are about to drop the column `shopId` on the `DeliveryOption` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "DeliveryOption" DROP CONSTRAINT "DeliveryOption_shopId_fkey";

-- AlterTable
ALTER TABLE "DeliveryOption" DROP COLUMN "shopId",
ADD COLUMN     "productId" TEXT,
ALTER COLUMN "unit" SET DEFAULT 'days';

-- AddForeignKey
ALTER TABLE "DeliveryOption" ADD CONSTRAINT "DeliveryOption_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
