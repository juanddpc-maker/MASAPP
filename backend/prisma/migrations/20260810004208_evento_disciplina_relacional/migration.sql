/*
  Warnings:
  - You are about to drop the column `disciplina` on the `eventos_cambio_cinta` table. All the data in the column will be lost.
  - Added the required column `disciplinaId` to the `eventos_cambio_cinta` table without a default value. This is not possible if the table is not empty.
*/

-- Borra los eventos de prueba ANTES de agregar la columna obligatoria
DELETE FROM "eventos_cambio_cinta";

-- AlterTable
ALTER TABLE "eventos_cambio_cinta" DROP COLUMN "disciplina",
ADD COLUMN     "disciplinaId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "eventos_cambio_cinta" ADD CONSTRAINT "eventos_cambio_cinta_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "disciplinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;