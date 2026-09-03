-- CreateEnum
CREATE TYPE "ModeJours" AS ENUM ('PLAGE', 'JOUR_PAR_JOUR');

-- AlterTable
ALTER TABLE "Mission" ADD COLUMN     "joursTravailles" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "modeJours" "ModeJours" NOT NULL DEFAULT 'PLAGE';
