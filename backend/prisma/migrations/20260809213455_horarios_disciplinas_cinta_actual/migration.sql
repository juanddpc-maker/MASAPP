/*
  Warnings:

  - You are about to drop the column `disciplina` on the `alumnos` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Genero" AS ENUM ('NINO', 'NINA');

-- AlterTable
ALTER TABLE "alumnos" DROP COLUMN "disciplina",
ADD COLUMN     "cintaActualId" TEXT,
ADD COLUMN     "genero" "Genero",
ADD COLUMN     "horarioId" TEXT;

-- CreateTable
CREATE TABLE "disciplinas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "disciplinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "horarios" (
    "id" TEXT NOT NULL,
    "disciplinaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "diasHora" TEXT NOT NULL,

    CONSTRAINT "horarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "disciplinas_nombre_key" ON "disciplinas"("nombre");

-- AddForeignKey
ALTER TABLE "horarios" ADD CONSTRAINT "horarios_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "disciplinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumnos" ADD CONSTRAINT "alumnos_horarioId_fkey" FOREIGN KEY ("horarioId") REFERENCES "horarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumnos" ADD CONSTRAINT "alumnos_cintaActualId_fkey" FOREIGN KEY ("cintaActualId") REFERENCES "cintas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
