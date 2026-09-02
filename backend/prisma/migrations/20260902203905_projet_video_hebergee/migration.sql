-- AlterTable
ALTER TABLE "Projet" ADD COLUMN     "videoMimeType" TEXT,
ADD COLUMN     "videoNomFichier" TEXT,
ADD COLUMN     "videoStockageNom" TEXT,
ADD COLUMN     "videoTailleOctets" INTEGER,
ALTER COLUMN "lienVideo" DROP NOT NULL;
