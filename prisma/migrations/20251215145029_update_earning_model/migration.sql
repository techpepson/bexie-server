-- DropForeignKey
ALTER TABLE "Earning" DROP CONSTRAINT "Earning_consumerId_fkey";

-- DropForeignKey
ALTER TABLE "Earning" DROP CONSTRAINT "Earning_riderId_fkey";

-- AlterTable
ALTER TABLE "Earning" ALTER COLUMN "riderId" DROP NOT NULL,
ALTER COLUMN "consumerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Earning" ADD CONSTRAINT "Earning_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Earning" ADD CONSTRAINT "Earning_consumerId_fkey" FOREIGN KEY ("consumerId") REFERENCES "Consumer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
