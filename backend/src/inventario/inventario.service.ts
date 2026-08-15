import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductoDto, UpdateProductoDto, CreateVarianteDto, MovimientoDto } from './dto/inventario.dto';

@Injectable()
export class InventarioService {
  constructor(private prisma: PrismaService) {}

  findAllProductos() {
    return this.prisma.producto.findMany({
      include: { categoria: true, variantes: { include: { inventario: true } } },
    });
  }

  async findOneProducto(id: string) {
    const producto = await this.prisma.producto.findUnique({
      where: { id },
      include: { categoria: true, variantes: { include: { inventario: true } } },
    });
    if (!producto) throw new NotFoundException('Producto no encontrado');
    return producto;
  }

  createProducto(data: CreateProductoDto) {
    return this.prisma.producto.create({ data, include: { categoria: true } });
  }

  updateProducto(id: string, data: UpdateProductoDto) {
    return this.prisma.producto.update({ where: { id }, data: data as any, include: { categoria: true } });
  }

  // Crea la variante y su fila de inventario inicial en una sola operación
  async agregarVariante(productoId: string, data: CreateVarianteDto) {
    return this.prisma.varianteProducto.create({
      data: {
        productoId,
        talla: data.talla,
        color: data.color,
        sku: data.sku,
        precio: data.precio,
        inventario: { create: { stockActual: data.stockInicial, stockMinimo: 0 } },
      },
      include: { inventario: true },
    });
  }

  // Registra un movimiento y recalcula el stock_actual (la bitácora que planeamos)
  async registrarMovimiento(varianteId: string, dto: MovimientoDto, usuarioId: string) {
    const inventario = await this.prisma.inventario.findUnique({ where: { varianteId } });
    if (!inventario) throw new NotFoundException('Inventario no encontrado para esta variante');

    const delta = dto.tipo === 'ENTRADA' || dto.tipo === 'DEVOLUCION' ? dto.cantidad : -dto.cantidad;

    if (delta < 0 && inventario.stockActual + delta < 0) {
      throw new BadRequestException(`No hay suficiente stock: solo quedan ${inventario.stockActual} unidades`);
    }

    await this.prisma.movimientoInventario.create({
      data: {
        varianteId,
        tipo: dto.tipo as any,
        cantidad: dto.cantidad,
        usuarioId,
        nota: dto.nota,
      },
    });

    return this.prisma.inventario.update({
      where: { varianteId },
      data: { stockActual: { increment: delta } },
    });
  }

  findMovimientos(varianteId: string) {
    return this.prisma.movimientoInventario.findMany({
      where: { varianteId },
      orderBy: { fecha: 'desc' },
      include: { usuario: true },
    });
  }

  removeProducto(id: string) {
    return this.prisma.producto.update({ where: { id }, data: { activo: false } });
  }
}
