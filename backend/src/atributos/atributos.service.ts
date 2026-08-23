import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAtributoDto, UpdateAtributoDto } from './dto/atributo.dto';

@Injectable()
export class AtributosService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.atributo.findMany({ orderBy: { orden: 'asc' } });
  }

  create(data: CreateAtributoDto) {
    return this.prisma.atributo.create({ data });
  }

  update(id: string, data: UpdateAtributoDto) {
    return this.prisma.atributo.update({ where: { id }, data });
  }

  async remove(id: string) {
    const valores = await this.prisma.alumnoAtributoValor.count({ where: { atributoId: id } });
    if (valores > 0) throw new NotFoundException('No se puede eliminar: ya tiene evaluaciones registradas');
    return this.prisma.atributo.delete({ where: { id } });
  }
}
