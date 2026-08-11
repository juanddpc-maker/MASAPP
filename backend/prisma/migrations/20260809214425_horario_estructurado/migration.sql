/*
  Warnings:

  - You are about to drop the column `diasHora` on the `horarios` table. All the data in the column will be lost.
  - Added the required column `horaFin` to the `horarios` table without a default value. This is not possible if the table is not empty.
  - Added the required column `horaInicio` to the `horarios` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DiaSemana" AS ENUM ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO');

-- AlterTable
ALTER TABLE "horarios" DROP COLUMN "diasHora",
ADD COLUMN     "dias" "DiaSemana"[],
ADD COLUMN     "horaFin" TEXT NOT NULL,
ADD COLUMN     "horaInicio" TEXT NOT NULL;
