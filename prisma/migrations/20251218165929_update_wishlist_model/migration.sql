/*
  Warnings:

  - A unique constraint covering the columns `[consumerId,productId]` on the table `Wishlist` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Wishlist_consumerId_productId_key" ON "Wishlist"("consumerId", "productId");
