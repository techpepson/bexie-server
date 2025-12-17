/*
  Warnings:

  - Added the required column `bankCode` to the `MobileMoney` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MobileMoney" ADD COLUMN     "bankCode" TEXT NOT NULL;
