import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDisciplinaDto, UpdateDisciplinaDto } from './dto/disciplina.dto';

@Injectable()
export class DisciplinasService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.disciplina.findMany({ include: { horarios: true }, orderBy: { nombre: 'asc' } });
  }

  create(data: CreateDisciplinaDto) {
    return this.prisma.disciplina.create({ data });
  }

  update(id: string, data: UpdateDisciplinaDto) {
    return this.prisma.disciplina.update({ where: { id }, data });
  }

  async remove(id: string) {
    const horarios = await this.prisma.horario.count({ where: { disciplinaId: id } });
    if (horarios > 0) throw new NotFoundException('No se puede eliminar: tiene horarios asociados');
    return this.prisma.disciplina.delete({ where: { id } });
  }
}
