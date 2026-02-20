-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountRecoveryOption" TEXT,
ADD COLUMN     "address" TEXT,
ADD COLUMN     "background" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "currency" TEXT DEFAULT 'USD',
ADD COLUMN     "loginAlerts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "organization" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "zipCode" TEXT;
