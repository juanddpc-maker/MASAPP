import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVentaDto } from './dto/venta.dto';

@Injectable()
export class VentasService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.venta.findMany({
      include: { alumno: true, detalle: { include: { variante: { include: { producto: true } } } } },
      orderBy: { fecha: 'desc' },
    });
  }

  async findOne(id: string) {
    const venta = await this.prisma.venta.findUnique({
      where: { id },
      include: { alumno: true, detalle: { include: { variante: { include: { producto: true } } } } },
    });
    if (!venta) throw new NotFoundException('Venta no encontrada');
    return venta;
  }

  // Crea la venta, su detalle, y descuenta el stock automáticamente
  // (con bitácora en MovimientoInventario) en una sola operación.
  async create(dto: CreateVentaDto, usuarioId: string) {
    const variantes = await this.prisma.varianteProducto.findMany({
      where: { id: { in: dto.items.map((i) => i.varianteId) } },
      include: { inventario: true },
    });

    for (const item of dto.items) {
      const variante = variantes.find((v) => v.id === item.varianteId);
      if (!variante) throw new NotFoundException(`Variante ${item.varianteId} no encontrada`);
      if (!variante.inventario || variante.inventario.stockActual < item.cantidad) {
        throw new BadRequestException(`Stock insuficiente para ${variante.sku}`);
      }
    }

    const total = dto.items.reduce((sum, item) => {
      const variante = variantes.find((v) => v.id === item.varianteId);
      if (!variante) throw new NotFoundException(`Variante ${item.varianteId} no encontrada`);
      return sum + Number(variante.precio) * item.cantidad;
    }, 0);

    const venta = await this.prisma.venta.create({
      data: {
        alumnoId: dto.alumnoId,
        total,
        metodoPago: dto.metodoPago,
        estado: 'PAGADO',
        detalle: {
          create: dto.items.map((item) => {
            const variante = variantes.find((v) => v.id === item.varianteId);
            if (!variante) throw new NotFoundException(`Variante ${item.varianteId} no encontrada`);
            return { varianteId: item.varianteId, cantidad: item.cantidad, precioUnitario: variante.precio };
          }),
        },
      },
      include: { detalle: true },
    });

    // Descontar stock + registrar movimiento por cada línea vendida
    for (const item of dto.items) {
      await this.prisma.inventario.update({
        where: { varianteId: item.varianteId },
        data: { stockActual: { decrement: item.cantidad } },
      });
      await this.prisma.movimientoInventario.create({
        data: {
          varianteId: item.varianteId,
          tipo: 'VENTA',
          cantidad: item.cantidad,
          referencia: venta.id,
          usuarioId,
        },
      });
    }

    return venta;
  }
}
