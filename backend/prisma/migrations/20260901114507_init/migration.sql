-- CreateEnum
CREATE TYPE "TypeMission" AS ENUM ('INTERMITTENCE', 'FREELANCE');

-- CreateEnum
CREATE TYPE "StatutMission" AS ENUM ('PROPOSEE', 'CONFIRMEE', 'TERMINEE');

-- CreateEnum
CREATE TYPE "CategorieDocument" AS ENUM ('CONTRAT', 'ATTESTATION_EMPLOYEUR', 'DEVIS', 'FACTURE', 'AUTRE');

-- CreateEnum
CREATE TYPE "TagProjet" AS ENUM ('PRO', 'PERSO');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Config" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "seuilHeures" INTEGER NOT NULL DEFAULT 507,
    "dureeFenetreMois" INTEGER NOT NULL DEFAULT 12,
    "journeeTypeHeures" DOUBLE PRECISION NOT NULL DEFAULT 8,
    "heuresParCachet" DOUBLE PRECISION NOT NULL DEFAULT 8,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mission" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "clientOuProduction" TEXT NOT NULL,
    "type" "TypeMission" NOT NULL,
    "statut" "StatutMission" NOT NULL DEFAULT 'PROPOSEE',
    "dateDebut" DATE NOT NULL,
    "dateFin" DATE NOT NULL,
    "note" TEXT,
    "heures" DOUBLE PRECISION,
    "nbCachets" DOUBLE PRECISION,
    "montantHT" DOUBLE PRECISION,
    "nbJours" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" SERIAL NOT NULL,
    "nomFichier" TEXT NOT NULL,
    "stockageNom" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tailleOctets" INTEGER NOT NULL,
    "categorie" "CategorieDocument" NOT NULL,
    "missionId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Projet" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tag" "TagProjet" NOT NULL,
    "date" DATE NOT NULL,
    "lienVideo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Projet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Document_stockageNom_key" ON "Document"("stockageNom");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
