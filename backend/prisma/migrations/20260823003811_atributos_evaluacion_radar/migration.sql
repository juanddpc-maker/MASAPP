-- CreateTable
CREATE TABLE "atributos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "atributos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alumno_atributo_valores" (
    "id" TEXT NOT NULL,
    "alumnoId" TEXT NOT NULL,
    "atributoId" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registradoPorId" TEXT,
    "nota" TEXT,

    CONSTRAINT "alumno_atributo_valores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "atributos_nombre_key" ON "atributos"("nombre");

-- AddForeignKey
ALTER TABLE "alumno_atributo_valores" ADD CONSTRAINT "alumno_atributo_valores_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "alumnos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumno_atributo_valores" ADD CONSTRAINT "alumno_atributo_valores_atributoId_fkey" FOREIGN KEY ("atributoId") REFERENCES "atributos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
