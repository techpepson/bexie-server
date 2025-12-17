/*
  Warnings:

  - Changed the type of `expiryDate` on the `Card` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Card" DROP COLUMN "expiryDate",
ADD COLUMN     "expiryDate" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" TEXT,
ADD COLUMN     "preferNewProductNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "preferOrderNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "preferPromotionalEmails" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "region" TEXT NOT NULL DEFAULT 'accra';
