/*
  Warnings:

  - You are about to drop the column `productId` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Shop` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[vendorId]` on the table `Shop` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `vendorId` to the `Shop` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Vendor" DROP CONSTRAINT "Vendor_shopId_fkey";

-- AlterTable
ALTER TABLE "Shop" DROP COLUMN "productId",
DROP COLUMN "userId",
ADD COLUMN     "vendorId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Shop_vendorId_key" ON "Shop"("vendorId");

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
