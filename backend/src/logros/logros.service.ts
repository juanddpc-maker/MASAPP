import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLogroDto, UpdateLogroDto } from './dto/logro.dto';

@Injectable()
export class LogrosService {
  constructor(private prisma: PrismaService) {}

  findByAlumno(alumnoId: string) {
    return this.prisma.logroAlumno.findMany({ where: { alumnoId }, orderBy: { fecha: 'desc' } });
  }

  create(dto: CreateLogroDto) {
    return this.prisma.logroAlumno.create({
      data: {
        alumnoId: dto.alumnoId,
        titulo: dto.titulo.trim(),
        fecha: new Date(dto.fecha),
        descripcion: dto.descripcion?.trim() || null,
      },
    });
  }

  async update(id: string, dto: UpdateLogroDto) {
    const existe = await this.prisma.logroAlumno.findUnique({ where: { id } });
    if (!existe) throw new NotFoundException('Logro no encontrado');
    return this.prisma.logroAlumno.update({
      where: { id },
      data: {
        titulo: dto.titulo?.trim(),
        fecha: dto.fecha ? new Date(dto.fecha) : undefined,
        descripcion: dto.descripcion === undefined ? undefined : dto.descripcion.trim() || null,
      },
    });
  }

  async remove(id: string) {
    const existe = await this.prisma.logroAlumno.findUnique({ where: { id } });
    if (!existe) throw new NotFoundException('Logro no encontrado');
    return this.prisma.logroAlumno.delete({ where: { id } });
  }
}
