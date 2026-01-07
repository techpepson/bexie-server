-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryStatus" TEXT NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "UserNotification" ADD COLUMN     "riderId" TEXT;

-- AddForeignKey
ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
