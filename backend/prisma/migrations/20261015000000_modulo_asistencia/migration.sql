-- CreateEnum
CREATE TYPE "EstadoAsistencia" AS ENUM ('PRESENTE', 'RETARDO');

-- CreateTable
CREATE TABLE "sesiones_asistencia" (
    "id" TEXT NOT NULL,
    "horarioId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sesiones_asistencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asistencia_alumnos" (
    "id" TEXT NOT NULL,
    "sesionId" TEXT NOT NULL,
    "alumnoId" TEXT NOT NULL,
    "estado" "EstadoAsistencia" NOT NULL,
    "horaMarcado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asistencia_alumnos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sesiones_asistencia_horarioId_fecha_key" ON "sesiones_asistencia"("horarioId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "asistencia_alumnos_sesionId_alumnoId_key" ON "asistencia_alumnos"("sesionId", "alumnoId");

-- AddForeignKey
ALTER TABLE "sesiones_asistencia" ADD CONSTRAINT "sesiones_asistencia_horarioId_fkey" FOREIGN KEY ("horarioId") REFERENCES "horarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asistencia_alumnos" ADD CONSTRAINT "asistencia_alumnos_sesionId_fkey" FOREIGN KEY ("sesionId") REFERENCES "sesiones_asistencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asistencia_alumnos" ADD CONSTRAINT "asistencia_alumnos_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "alumnos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
