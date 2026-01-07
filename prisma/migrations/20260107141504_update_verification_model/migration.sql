/*
  Warnings:

  - Added the required column `vehicleNumber` to the `Verification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vehicleType` to the `Verification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Verification" ADD COLUMN     "vehicleNumber" TEXT NOT NULL,
ADD COLUMN     "vehicleType" TEXT NOT NULL;
