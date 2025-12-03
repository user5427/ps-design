-- CreateEnum
CREATE TYPE "StockChangeType" AS ENUM ('SUPPLY', 'USAGE', 'ADJUSTMENT', 'WASTE');

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ProductUnit" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT,
    "businessId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProductUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDisabled" BOOLEAN NOT NULL DEFAULT false,
    "businessId" UUID NOT NULL,
    "productUnitId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockChange" (
    "id" UUID NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "type" "StockChangeType" NOT NULL,
    "expirationDate" DATE,
    "businessId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "createdByUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "StockChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockLevel" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "productId" UUID NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockLevel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductUnit_businessId_idx" ON "ProductUnit"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductUnit_businessId_name_key" ON "ProductUnit"("businessId", "name");

-- CreateIndex
CREATE INDEX "Product_businessId_idx" ON "Product"("businessId");

-- CreateIndex
CREATE INDEX "Product_productUnitId_idx" ON "Product"("productUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_businessId_name_key" ON "Product"("businessId", "name");

-- CreateIndex
CREATE INDEX "StockChange_businessId_idx" ON "StockChange"("businessId");

-- CreateIndex
CREATE INDEX "StockChange_businessId_productId_idx" ON "StockChange"("businessId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "StockLevel_productId_key" ON "StockLevel"("productId");

-- CreateIndex
CREATE INDEX "StockLevel_businessId_idx" ON "StockLevel"("businessId");

-- CreateIndex
CREATE INDEX "StockLevel_businessId_productId_idx" ON "StockLevel"("businessId", "productId");

-- CreateIndex
CREATE INDEX "User_businessId_idx" ON "User"("businessId");

-- AddForeignKey
ALTER TABLE "ProductUnit" ADD CONSTRAINT "ProductUnit_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_productUnitId_fkey" FOREIGN KEY ("productUnitId") REFERENCES "ProductUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockChange" ADD CONSTRAINT "StockChange_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockChange" ADD CONSTRAINT "StockChange_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockChange" ADD CONSTRAINT "StockChange_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLevel" ADD CONSTRAINT "StockLevel_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
