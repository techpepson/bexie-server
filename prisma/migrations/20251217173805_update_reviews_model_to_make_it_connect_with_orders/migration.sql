/*
  Warnings:

  - Added the required column `orderId` to the `Reviews` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Reviews" DROP CONSTRAINT "Reviews_productId_fkey";

-- AlterTable
ALTER TABLE "Reviews" ADD COLUMN     "orderId" TEXT NOT NULL,
ALTER COLUMN "productId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
