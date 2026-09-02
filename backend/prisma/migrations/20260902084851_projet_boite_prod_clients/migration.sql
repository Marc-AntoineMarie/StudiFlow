-- AlterTable
ALTER TABLE "Projet" ADD COLUMN     "boiteProduction" TEXT,
ADD COLUMN     "clients" TEXT[] DEFAULT ARRAY[]::TEXT[];
