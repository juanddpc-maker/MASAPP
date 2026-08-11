import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCintaDto, UpdateCintaDto } from './dto/cinta.dto';

@Injectable()
export class CintasService {
  constructor(private prisma: PrismaService) {}

  findAll(disciplinaId?: string) {
    return this.prisma.cinta.findMany({
      where: disciplinaId ? { disciplinaId } : undefined,
      include: { disciplina: true },
      orderBy: { orden: 'asc' },
    });
  }

  async findOne(id: string) {
    const cinta = await this.prisma.cinta.findUnique({ where: { id }, include: { disciplina: true } });
    if (!cinta) throw new NotFoundException('Cinta no encontrada');
    return cinta;
  }

  create(data: CreateCintaDto) {
    return this.prisma.cinta.create({ data, include: { disciplina: true } });
  }

  update(id: string, data: UpdateCintaDto) {
    return this.prisma.cinta.update({ where: { id }, data, include: { disciplina: true } });
  }

  // Alumnos activos que tienen esta cinta como su cinta actual
  findAlumnosConEstaCinta(id: string) {
    return this.prisma.alumno.findMany({
      where: { cintaActualId: id, estado: 'ACTIVO' },
      include: { horarios: { include: { horario: true } } },
      orderBy: { nombreCompleto: 'asc' },
    });
  }

  // Cuántos alumnos activos tiene cada cinta, para la gráfica general del catálogo
  async conteoAlumnosPorCinta() {
    const conteos = await this.prisma.alumno.groupBy({
      by: ['cintaActualId'],
      where: { estado: 'ACTIVO', cintaActualId: { not: null } },
      _count: { _all: true },
    });
    return conteos.map((c) => ({ cintaId: c.cintaActualId, cantidad: c._count._all }));
  }

  remove(id: string) {
    return this.prisma.cinta.delete({ where: { id } });
  }
}
