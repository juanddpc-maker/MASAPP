import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoriaDto, UpdateCategoriaDto } from './dto/categoria.dto';

@Injectable()
export class CategoriasService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.categoria.findMany({ orderBy: { nombre: 'asc' } });
  }

  create(data: CreateCategoriaDto) {
    return this.prisma.categoria.create({ data });
  }

  update(id: string, data: UpdateCategoriaDto) {
    return this.prisma.categoria.update({ where: { id }, data });
  }

  async remove(id: string) {
    const productos = await this.prisma.producto.count({ where: { categoriaId: id } });
    if (productos > 0) throw new NotFoundException('No se puede eliminar: tiene productos asociados');
    return this.prisma.categoria.delete({ where: { id } });
  }
}
