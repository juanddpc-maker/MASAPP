/*
  Warnings:
  - You are about to drop the column `categoria` on the `productos` table. All the data in the column will be lost.
  - Added the required column `categoriaId` to the `productos` table without a default value. This is not possible if the table is not empty.
*/

-- Borra los productos de prueba ANTES de que la columna se vuelva obligatoria
DELETE FROM "productos";

-- AlterTable
ALTER TABLE "productos" DROP COLUMN "categoria",
ADD COLUMN     "categoriaId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;