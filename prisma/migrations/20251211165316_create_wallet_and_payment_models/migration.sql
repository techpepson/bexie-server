-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "riderId" TEXT;

-- CreateTable
CREATE TABLE "Rider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "walletId" TEXT NOT NULL,

    CONSTRAINT "Rider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemNotification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "systemNotificationId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Admin',
    "password" TEXT NOT NULL DEFAULT 'admin123',
    "email" TEXT NOT NULL DEFAULT 'admin@bexiemart.com',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemLogs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "initReference" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "accessCode" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "paymentMethod" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferRecipients" (
    "id" TEXT NOT NULL,
    "type" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "name" TEXT,
    "accountNumber" TEXT,
    "accountName" TEXT,
    "bankCode" TEXT,
    "bankName" TEXT NOT NULL,
    "recipientCode" TEXT NOT NULL,
    "activeStatus" BOOLEAN NOT NULL DEFAULT false,
    "recipientId" INTEGER,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransferRecipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "riderId" TEXT NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rider_email_key" ON "Rider"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_initReference_key" ON "Payment"("initReference");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_userId_key" ON "Payment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TransferRecipients_userId_key" ON "TransferRecipients"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_riderId_key" ON "Wallet"("riderId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_systemNotificationId_fkey" FOREIGN KEY ("systemNotificationId") REFERENCES "SystemNotification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemLogs" ADD CONSTRAINT "SystemLogs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferRecipients" ADD CONSTRAINT "TransferRecipients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
