-- Add missing columns to LandlordKyc for manual KYC verification data
ALTER TABLE "LandlordKyc" ADD COLUMN "idName" TEXT;
ALTER TABLE "LandlordKyc" ADD COLUMN "idNumber" TEXT;
ALTER TABLE "LandlordKyc" ADD COLUMN "ownershipName" TEXT;
