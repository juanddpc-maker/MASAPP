/*
  Warnings:
  - You are about to drop the column `horarioId` on the `alumnos` table. All the data in the column will be lost.
*/
-- CreateTable
CREATE TABLE "alumno_horarios" (
    "id" TEXT NOT NULL,
    "alumnoId" TEXT NOT NULL,
    "horarioId" TEXT NOT NULL,
    "esPrincipal" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "alumno_horarios_pkey" PRIMARY KEY ("id")
);

-- Migrar datos existentes ANTES de borrar la columna vieja
INSERT INTO "alumno_horarios" ("id", "alumnoId", "horarioId", "esPrincipal") SELECT gen_random_uuid(), "id", "horarioId", true FROM "alumnos" WHERE "horarioId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "alumnos" DROP CONSTRAINT "alumnos_horarioId_fkey";
-- AlterTable
ALTER TABLE "alumnos" DROP COLUMN "horarioId";

-- CreateIndex
CREATE UNIQUE INDEX "alumno_horarios_alumnoId_horarioId_key" ON "alumno_horarios"("alumnoId", "horarioId");
-- AddForeignKey
ALTER TABLE "alumno_horarios" ADD CONSTRAINT "alumno_horarios_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "alumnos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "alumno_horarios" ADD CONSTRAINT "alumno_horarios_horarioId_fkey" FOREIGN KEY ("horarioId") REFERENCES "horarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;