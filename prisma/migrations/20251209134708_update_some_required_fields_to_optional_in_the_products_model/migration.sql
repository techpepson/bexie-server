/*
  Warnings:

  - You are about to drop the column `userId` on the `Cart` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[consumerId]` on the table `Cart` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `consumerId` to the `Cart` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Cart" DROP CONSTRAINT "Cart_userId_fkey";

-- DropIndex
DROP INDEX "Cart_userId_key";

-- AlterTable
ALTER TABLE "Cart" DROP COLUMN "userId",
ADD COLUMN     "consumerId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Cart_consumerId_key" ON "Cart"("consumerId");

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_consumerId_fkey" FOREIGN KEY ("consumerId") REFERENCES "Consumer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
