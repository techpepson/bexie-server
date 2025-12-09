/*
  Warnings:

  - Added the required column `contact` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_deliveryOptionId_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "contact" TEXT NOT NULL,
ALTER COLUMN "deliveryOptionId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_deliveryOptionId_fkey" FOREIGN KEY ("deliveryOptionId") REFERENCES "DeliveryOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
