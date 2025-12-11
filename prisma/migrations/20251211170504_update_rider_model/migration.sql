/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Rider` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Rider` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Rider` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `Rider` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Rider` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Rider` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Rider` table. All the data in the column will be lost.
  - You are about to drop the column `walletId` on the `Rider` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Rider` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Rider` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Wallet" DROP CONSTRAINT "Wallet_riderId_fkey";

-- DropIndex
DROP INDEX "Rider_email_key";

-- AlterTable
ALTER TABLE "Rider" DROP COLUMN "createdAt",
DROP COLUMN "email",
DROP COLUMN "name",
DROP COLUMN "password",
DROP COLUMN "phone",
DROP COLUMN "status",
DROP COLUMN "updatedAt",
DROP COLUMN "walletId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Rider_userId_key" ON "Rider"("userId");

-- AddForeignKey
ALTER TABLE "Rider" ADD CONSTRAINT "Rider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
