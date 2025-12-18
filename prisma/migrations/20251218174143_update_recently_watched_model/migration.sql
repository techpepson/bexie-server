/*
  Warnings:

  - A unique constraint covering the columns `[productId,userId]` on the table `RecentlyWatched` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "RecentlyWatched_productId_userId_key" ON "RecentlyWatched"("productId", "userId");
