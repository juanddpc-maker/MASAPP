/*
  Warnings:
  - The values [PLANIFICADO,EN_CURSO,CERRADO] on the enum `EstadoEvento` will be removed. If these variants are still used in the database, this will fail.
*/
-- AlterEnum
BEGIN;
CREATE TYPE "EstadoEvento_new" AS ENUM ('PLANEACION', 'EN_PROGRESO', 'COMPLETADO', 'CANCELADO');
ALTER TABLE "eventos_cambio_cinta" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "eventos_cambio_cinta" ALTER COLUMN "estado" TYPE "EstadoEvento_new" USING (
  CASE "estado"::text
    WHEN 'PLANIFICADO' THEN 'PLANEACION'
    WHEN 'EN_CURSO' THEN 'EN_PROGRESO'
    WHEN 'CERRADO' THEN 'COMPLETADO'
    ELSE "estado"::text
  END
)::"EstadoEvento_new";
ALTER TYPE "EstadoEvento" RENAME TO "EstadoEvento_old";
ALTER TYPE "EstadoEvento_new" RENAME TO "EstadoEvento";
DROP TYPE "EstadoEvento_old";
ALTER TABLE "eventos_cambio_cinta" ALTER COLUMN "estado" SET DEFAULT 'PLANEACION';
COMMIT;
-- AlterTable
ALTER TABLE "eventos_cambio_cinta" ALTER COLUMN "estado" SET DEFAULT 'PLANEACION';