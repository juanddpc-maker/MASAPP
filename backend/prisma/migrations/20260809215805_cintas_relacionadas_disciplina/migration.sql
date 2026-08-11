/*
  Warnings:

  - You are about to drop the column `disciplina` on the `cintas` table. All the data in the column will be lost.
  - Added the required column `disciplinaId` to the `cintas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
 DELETE FROM "historial_cintas"; UPDATE "alumnos" SET "cintaActualId" = NULL; 
DELETE FROM "cintas";
ALTER TABLE "cintas" DROP COLUMN "disciplina",
ADD COLUMN     "disciplinaId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "cintas" ADD CONSTRAINT "cintas_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "disciplinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
