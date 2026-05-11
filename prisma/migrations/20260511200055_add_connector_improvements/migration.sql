-- AlterEnum: Update ConnectorStatus enum (rename 'broken' to 'maintenance')
ALTER TYPE "ConnectorStatus" RENAME VALUE 'broken' TO 'maintenance';

-- AlterTable: Add pricePerMinute column to connectors
ALTER TABLE "connectors" ADD COLUMN "price_per_minute" DECIMAL(6,2) NOT NULL DEFAULT 0;
