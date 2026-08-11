/*
  Warnings:

  - The values [NINO,NINA] on the enum `Genero` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Genero_new" AS ENUM ('MASCULINO', 'FEMENINO');
ALTER TABLE "alumnos" ALTER COLUMN "genero" TYPE "Genero_new" USING ("genero"::text::"Genero_new");
ALTER TYPE "Genero" RENAME TO "Genero_old";
ALTER TYPE "Genero_new" RENAME TO "Genero";
DROP TYPE "Genero_old";
COMMIT;
