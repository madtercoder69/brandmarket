-- AlterTable
ALTER TABLE "_ChatUsers" ADD CONSTRAINT "_ChatUsers_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ChatUsers_AB_unique";

-- AlterTable
ALTER TABLE "_StoreToCategory" ADD CONSTRAINT "_StoreToCategory_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_StoreToCategory_AB_unique";

-- AlterTable
ALTER TABLE "_StoreToFilter" ADD CONSTRAINT "_StoreToFilter_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_StoreToFilter_AB_unique";

-- AlterTable
ALTER TABLE "_StoreToSubcategory" ADD CONSTRAINT "_StoreToSubcategory_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_StoreToSubcategory_AB_unique";

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" UUID NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "rateToUsd" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "header_buttons" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "header_buttons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_currencyCode_key" ON "exchange_rates"("currencyCode");
