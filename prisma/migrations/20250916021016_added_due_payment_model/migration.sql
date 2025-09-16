-- CreateTable
CREATE TABLE "DuePayment" (
    "orderID" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "mandateId" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentStatus" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "DuePayment_orderID_key" ON "DuePayment"("orderID");
