import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHorarioDto, UpdateHorarioDto } from './dto/horario.dto';

@Injectable()
export class HorariosService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.horario.findMany({ include: { disciplina: true }, orderBy: { nombre: 'asc' } });
  }

  create(data: CreateHorarioDto) {
    return this.prisma.horario.create({ data: data as any });
  }

  update(id: string, data: UpdateHorarioDto) {
    return this.prisma.horario.update({ where: { id }, data: data as any });
  }

  remove(id: string) {
    return this.prisma.horario.delete({ where: { id } });
  }
}
