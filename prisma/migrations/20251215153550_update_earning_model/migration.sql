/*
  Warnings:

  - You are about to drop the column `riderId` on the `Wallet` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Wallet_riderId_key";

-- AlterTable
ALTER TABLE "Wallet" DROP COLUMN "riderId";
