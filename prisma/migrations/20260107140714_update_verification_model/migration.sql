/*
  Warnings:

  - Added the required column `idNumber` to the `Verification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Verification" ADD COLUMN     "idNumber" TEXT NOT NULL;
