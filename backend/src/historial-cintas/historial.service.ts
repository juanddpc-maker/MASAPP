import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHistorialDto, UpdateHistorialDto } from './dto/historial.dto';

@Injectable()
export class HistorialService {
  constructor(private prisma: PrismaService) {}

  findByAlumno(alumnoId: string) {
    return this.prisma.historialCinta.findMany({
      where: { alumnoId },
      include: { cinta: true },
      orderBy: { fechaObtencion: 'desc' },
    });
  }

  // Diploma anterior = diploma del registro inmediatamente previo (por fecha). Es una copia
  // al momento de crear el registro y no se edita después.
  async diplomaPrevio(alumnoId: string, fecha: Date): Promise<string | null> {
    const previo = await this.prisma.historialCinta.findFirst({
      where: { alumnoId, fechaObtencion: { lte: fecha } },
      orderBy: { fechaObtencion: 'desc' },
    });
    return previo?.diplomaNuevo ?? null;
  }

  async create(dto: CreateHistorialDto) {
    const fecha = dto.fechaObtencion ? new Date(dto.fechaObtencion) : new Date();
    const diplomaAnterior = await this.diplomaPrevio(dto.alumnoId, fecha);
    return this.prisma.historialCinta.create({
      data: {
        alumnoId: dto.alumnoId,
        cintaId: dto.cintaId,
        fechaObtencion: fecha,
        instructor: dto.instructor,
        diplomaNuevo: dto.diplomaNuevo?.trim() || null,
        diplomaAnterior,
      },
      include: { cinta: true },
    });
  }

  async update(id: string, dto: UpdateHistorialDto) {
    const existe = await this.prisma.historialCinta.findUnique({ where: { id } });
    if (!existe) throw new NotFoundException('Registro de historial no encontrado');
    return this.prisma.historialCinta.update({
      where: { id },
      data: {
        cintaId: dto.cintaId,
        fechaObtencion: dto.fechaObtencion ? new Date(dto.fechaObtencion) : undefined,
        instructor: dto.instructor,
        diplomaNuevo: dto.diplomaNuevo === undefined ? undefined : dto.diplomaNuevo.trim() || null,
      },
      include: { cinta: true },
    });
  }

  remove(id: string) {
    return this.prisma.historialCinta.delete({ where: { id } });
  }

  // Limpieza masiva: borra TODO el historial de un alumno (útil para limpiar datos de prueba)
  removeAllByAlumno(alumnoId: string) {
    return this.prisma.historialCinta.deleteMany({ where: { alumnoId } });
  }
}
