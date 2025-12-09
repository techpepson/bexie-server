-- DropForeignKey
ALTER TABLE "Cart" DROP CONSTRAINT "Cart_consumerId_fkey";

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_consumerId_fkey" FOREIGN KEY ("consumerId") REFERENCES "Consumer"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
