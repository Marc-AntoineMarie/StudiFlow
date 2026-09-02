-- CreateTable
CREATE TABLE "LienPortfolio" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "titre" TEXT,
    "projetIds" INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LienPortfolio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LienPortfolio_token_key" ON "LienPortfolio"("token");
