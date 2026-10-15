-- AlterTable
ALTER TABLE "historial_cintas" ADD COLUMN "diplomaNuevo" TEXT,
ADD COLUMN "diplomaAnterior" TEXT;

-- CreateTable
CREATE TABLE "logros_alumno" (
    "id" TEXT NOT NULL,
    "alumnoId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "logros_alumno_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "logros_alumno" ADD CONSTRAINT "logros_alumno_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "alumnos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
