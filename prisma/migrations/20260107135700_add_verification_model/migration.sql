-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "frontOfIdCard" TEXT NOT NULL,
    "backOfIdCard" TEXT NOT NULL,
    "passportPhoto" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "licenseNumber" TEXT NOT NULL,
    "fullNameOnId" TEXT NOT NULL,
    "idExpiryDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Verification_riderId_key" ON "Verification"("riderId");

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
