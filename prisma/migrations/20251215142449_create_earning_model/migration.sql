/*
  Warnings:

  - A unique constraint covering the columns `[referralCode]` on the table `Consumer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `referralCode` to the `Consumer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Consumer" ADD COLUMN     "referralCode" TEXT NOT NULL,
ADD COLUMN     "totalReferrals" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Earning" (
    "id" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "pendingCommission" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "totalWithdrawn" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "riderId" TEXT NOT NULL,
    "consumerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Earning_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Earning_consumerId_key" ON "Earning"("consumerId");

-- CreateIndex
CREATE UNIQUE INDEX "Consumer_referralCode_key" ON "Consumer"("referralCode");

-- AddForeignKey
ALTER TABLE "Earning" ADD CONSTRAINT "Earning_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Earning" ADD CONSTRAINT "Earning_consumerId_fkey" FOREIGN KEY ("consumerId") REFERENCES "Consumer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
