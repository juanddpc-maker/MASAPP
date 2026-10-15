-- AlterTable
ALTER TABLE "alumnos" ADD COLUMN "curp" TEXT,
ADD COLUMN "pais" TEXT;

-- CreateTable
CREATE TABLE "fotos_alumno" (
    "id" TEXT NOT NULL,
    "alumnoId" TEXT NOT NULL,
    "ruta" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fotos_alumno_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "fotos_alumno" ADD CONSTRAINT "fotos_alumno_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "alumnos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
