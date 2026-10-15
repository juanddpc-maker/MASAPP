-- CreateEnum
CREATE TYPE "AlcanceAtributo" AS ENUM ('GENERAL', 'PERSONAL');

-- CreateEnum
CREATE TYPE "EstadoPeriodoEval" AS ENUM ('ABIERTO', 'CERRADO');

-- AlterTable (los atributos existentes quedan como GENERAL)
ALTER TABLE "atributos" ADD COLUMN "alcance" "AlcanceAtributo" NOT NULL DEFAULT 'GENERAL';

-- CreateTable
CREATE TABLE "atributos_alumno" (
    "id" TEXT NOT NULL,
    "atributoId" TEXT NOT NULL,
    "alumnoId" TEXT NOT NULL,
    CONSTRAINT "atributos_alumno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "periodos_evaluacion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoPeriodoEval" NOT NULL DEFAULT 'ABIERTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "periodos_evaluacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluaciones_mensuales" (
    "id" TEXT NOT NULL,
    "periodoId" TEXT NOT NULL,
    "alumnoId" TEXT NOT NULL,
    "instructorId" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "evaluaciones_mensuales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluacion_valores" (
    "id" TEXT NOT NULL,
    "evaluacionId" TEXT NOT NULL,
    "atributoId" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,
    CONSTRAINT "evaluacion_valores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "atributos_alumno_atributoId_alumnoId_key" ON "atributos_alumno"("atributoId", "alumnoId");

-- CreateIndex
CREATE UNIQUE INDEX "evaluaciones_mensuales_periodoId_alumnoId_key" ON "evaluaciones_mensuales"("periodoId", "alumnoId");

-- CreateIndex
CREATE UNIQUE INDEX "evaluacion_valores_evaluacionId_atributoId_key" ON "evaluacion_valores"("evaluacionId", "atributoId");

-- AddForeignKey
ALTER TABLE "atributos_alumno" ADD CONSTRAINT "atributos_alumno_atributoId_fkey" FOREIGN KEY ("atributoId") REFERENCES "atributos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atributos_alumno" ADD CONSTRAINT "atributos_alumno_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "alumnos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluaciones_mensuales" ADD CONSTRAINT "evaluaciones_mensuales_periodoId_fkey" FOREIGN KEY ("periodoId") REFERENCES "periodos_evaluacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluaciones_mensuales" ADD CONSTRAINT "evaluaciones_mensuales_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "alumnos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluacion_valores" ADD CONSTRAINT "evaluacion_valores_evaluacionId_fkey" FOREIGN KEY ("evaluacionId") REFERENCES "evaluaciones_mensuales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluacion_valores" ADD CONSTRAINT "evaluacion_valores_atributoId_fkey" FOREIGN KEY ("atributoId") REFERENCES "atributos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
