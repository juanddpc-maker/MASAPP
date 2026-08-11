/*
  Warnings:

  - You are about to drop the column `tutorId` on the `alumnos` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[correo]` on the table `tutores` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "alumnos" DROP CONSTRAINT "alumnos_tutorId_fkey";

-- AlterTable
ALTER TABLE "alumnos" DROP COLUMN "tutorId";

-- CreateTable
CREATE TABLE "alumno_tutores" (
    "id" TEXT NOT NULL,
    "alumnoId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "esPrincipal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "alumno_tutores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escuela" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL DEFAULT 'Mi escuela',
    "logoUrl" TEXT,

    CONSTRAINT "escuela_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "alumno_tutores_alumnoId_tutorId_key" ON "alumno_tutores"("alumnoId", "tutorId");

-- CreateIndex
CREATE UNIQUE INDEX "tutores_correo_key" ON "tutores"("correo");

-- AddForeignKey
ALTER TABLE "alumno_tutores" ADD CONSTRAINT "alumno_tutores_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "alumnos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumno_tutores" ADD CONSTRAINT "alumno_tutores_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "tutores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
