-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMINISTRADOR', 'INSTRUCTOR', 'TUTOR');

-- CreateEnum
CREATE TYPE "EstadoAlumno" AS ENUM ('ACTIVO', 'INACTIVO', 'SUSPENDIDO');

-- CreateEnum
CREATE TYPE "EstadoEvento" AS ENUM ('PLANIFICADO', 'EN_CURSO', 'CERRADO');

-- CreateEnum
CREATE TYPE "ResultadoExamen" AS ENUM ('PENDIENTE', 'APROBADO', 'NO_APROBADO', 'NO_SE_PRESENTO');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'PAGADO', 'VENCIDO', 'EXONERADO');

-- CreateEnum
CREATE TYPE "TipoConversacion" AS ENUM ('COMPORTAMIENTO', 'PAGO', 'EXAMEN', 'AVISO_GENERAL', 'CONSULTA_TUTOR');

-- CreateEnum
CREATE TYPE "EstadoConversacion" AS ENUM ('ABIERTA', 'CERRADA');

-- CreateEnum
CREATE TYPE "TipoComportamiento" AS ENUM ('POSITIVO', 'NEGATIVO', 'NEUTRO');

-- CreateEnum
CREATE TYPE "TipoMovimientoInventario" AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE', 'VENTA', 'DEVOLUCION');

-- CreateEnum
CREATE TYPE "EstadoVenta" AS ENUM ('PENDIENTE', 'PAGADO', 'ENTREGADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL,
    "disciplinas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "tutorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutores" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "correo" TEXT,
    "relacion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tutores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alumnos" (
    "id" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "tallaCinta" TEXT,
    "tallaUniforme" TEXT,
    "condicionesMedicas" TEXT,
    "disciplina" TEXT NOT NULL,
    "estado" "EstadoAlumno" NOT NULL DEFAULT 'ACTIVO',
    "tutorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alumnos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cintas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "disciplina" TEXT NOT NULL,

    CONSTRAINT "cintas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_cintas" (
    "id" TEXT NOT NULL,
    "alumnoId" TEXT NOT NULL,
    "cintaId" TEXT NOT NULL,
    "fechaObtencion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "instructor" TEXT,
    "eventoCandidatoId" TEXT,

    CONSTRAINT "historial_cintas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos_cambio_cinta" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fechaExamen" TIMESTAMP(3) NOT NULL,
    "disciplina" TEXT NOT NULL,
    "estado" "EstadoEvento" NOT NULL DEFAULT 'PLANIFICADO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_cambio_cinta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evento_candidatos" (
    "id" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "alumnoId" TEXT NOT NULL,
    "cintaObjetivo" TEXT NOT NULL,
    "tallaCintaDefault" TEXT,
    "tallaConfirmada" TEXT,
    "tutorConfirmo" BOOLEAN NOT NULL DEFAULT false,
    "fechaConfirmacion" TIMESTAMP(3),
    "resultado" "ResultadoExamen" NOT NULL DEFAULT 'PENDIENTE',
    "notas" TEXT,

    CONSTRAINT "evento_candidatos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "periodos_pago" (
    "id" TEXT NOT NULL,
    "mesAnio" TEXT NOT NULL,
    "fechaLimite" TIMESTAMP(3) NOT NULL,
    "montoDefault" DECIMAL(10,2) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ABIERTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "periodos_pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "periodo_candidatos" (
    "id" TEXT NOT NULL,
    "periodoId" TEXT NOT NULL,
    "alumnoId" TEXT NOT NULL,
    "montoAPagar" DECIMAL(10,2) NOT NULL,
    "estadoPago" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "fechaPago" TIMESTAMP(3),
    "metodoPago" TEXT,
    "comprobante" TEXT,

    CONSTRAINT "periodo_candidatos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversaciones" (
    "id" TEXT NOT NULL,
    "alumnoId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "iniciadoPorId" TEXT NOT NULL,
    "tipo" "TipoConversacion" NOT NULL,
    "asunto" TEXT NOT NULL,
    "estado" "EstadoConversacion" NOT NULL DEFAULT 'ABIERTA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaUltimaActividad" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensajes" (
    "id" TEXT NOT NULL,
    "conversacionId" TEXT NOT NULL,
    "emisorId" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "fechaEnvio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "fechaLectura" TIMESTAMP(3),

    CONSTRAINT "mensajes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_comportamiento" (
    "id" TEXT NOT NULL,
    "alumnoId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "tipo" "TipoComportamiento" NOT NULL,
    "categoria" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conversacionId" TEXT,
    "requiereSeguimiento" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "registros_comportamiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "disciplina" TEXT,
    "precioBase" DECIMAL(10,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variantes_producto" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "talla" TEXT,
    "color" TEXT,
    "sku" TEXT NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "variantes_producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventario" (
    "id" TEXT NOT NULL,
    "varianteId" TEXT NOT NULL,
    "stockActual" INTEGER NOT NULL DEFAULT 0,
    "stockMinimo" INTEGER NOT NULL DEFAULT 0,
    "ultimaActualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id" TEXT NOT NULL,
    "varianteId" TEXT NOT NULL,
    "tipo" "TipoMovimientoInventario" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "referencia" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,
    "nota" TEXT,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas" (
    "id" TEXT NOT NULL,
    "alumnoId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total" DECIMAL(10,2) NOT NULL,
    "estado" "EstadoVenta" NOT NULL DEFAULT 'PENDIENTE',
    "metodoPago" TEXT,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalle_venta" (
    "id" TEXT NOT NULL,
    "ventaId" TEXT NOT NULL,
    "varianteId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "detalle_venta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_tutorId_key" ON "usuarios"("tutorId");

-- CreateIndex
CREATE UNIQUE INDEX "historial_cintas_eventoCandidatoId_key" ON "historial_cintas"("eventoCandidatoId");

-- CreateIndex
CREATE UNIQUE INDEX "evento_candidatos_eventoId_alumnoId_key" ON "evento_candidatos"("eventoId", "alumnoId");

-- CreateIndex
CREATE UNIQUE INDEX "periodo_candidatos_periodoId_alumnoId_key" ON "periodo_candidatos"("periodoId", "alumnoId");

-- CreateIndex
CREATE UNIQUE INDEX "registros_comportamiento_conversacionId_key" ON "registros_comportamiento"("conversacionId");

-- CreateIndex
CREATE UNIQUE INDEX "variantes_producto_sku_key" ON "variantes_producto"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "inventario_varianteId_key" ON "inventario"("varianteId");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "tutores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumnos" ADD CONSTRAINT "alumnos_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "tutores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_cintas" ADD CONSTRAINT "historial_cintas_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "alumnos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_cintas" ADD CONSTRAINT "historial_cintas_cintaId_fkey" FOREIGN KEY ("cintaId") REFERENCES "cintas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_cintas" ADD CONSTRAINT "historial_cintas_eventoCandidatoId_fkey" FOREIGN KEY ("eventoCandidatoId") REFERENCES "evento_candidatos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_candidatos" ADD CONSTRAINT "evento_candidatos_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "eventos_cambio_cinta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_candidatos" ADD CONSTRAINT "evento_candidatos_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "alumnos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "periodo_candidatos" ADD CONSTRAINT "periodo_candidatos_periodoId_fkey" FOREIGN KEY ("periodoId") REFERENCES "periodos_pago"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "periodo_candidatos" ADD CONSTRAINT "periodo_candidatos_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "alumnos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversaciones" ADD CONSTRAINT "conversaciones_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "alumnos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversaciones" ADD CONSTRAINT "conversaciones_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "tutores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversaciones" ADD CONSTRAINT "conversaciones_iniciadoPorId_fkey" FOREIGN KEY ("iniciadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes" ADD CONSTRAINT "mensajes_conversacionId_fkey" FOREIGN KEY ("conversacionId") REFERENCES "conversaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes" ADD CONSTRAINT "mensajes_emisorId_fkey" FOREIGN KEY ("emisorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_comportamiento" ADD CONSTRAINT "registros_comportamiento_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "alumnos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_comportamiento" ADD CONSTRAINT "registros_comportamiento_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_comportamiento" ADD CONSTRAINT "registros_comportamiento_conversacionId_fkey" FOREIGN KEY ("conversacionId") REFERENCES "conversaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variantes_producto" ADD CONSTRAINT "variantes_producto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario" ADD CONSTRAINT "inventario_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "variantes_producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "variantes_producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "alumnos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_venta" ADD CONSTRAINT "detalle_venta_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "ventas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_venta" ADD CONSTRAINT "detalle_venta_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "variantes_producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
