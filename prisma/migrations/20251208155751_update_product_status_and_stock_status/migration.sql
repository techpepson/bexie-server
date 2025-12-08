/*
  Warnings:

  - Added the required column `status` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stockStatus` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "status" TEXT NOT NULL,
ADD COLUMN     "stockStatus" TEXT NOT NULL;
