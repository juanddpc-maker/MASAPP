import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegistroDto } from './dto/comportamiento.dto';

@Injectable()
export class ComportamientoService {
  constructor(private prisma: PrismaService) {}

  findByAlumno(alumnoId: string) {
    return this.prisma.registroComportamiento.findMany({
      where: { alumnoId },
      include: { instructor: true, conversacion: true },
      orderBy: { fecha: 'desc' },
    });
  }

  findAll() {
    return this.prisma.registroComportamiento.findMany({
      include: { alumno: true, instructor: true },
      orderBy: { fecha: 'desc' },
    });
  }

  // Crea el registro y, si se pide notificar, también la Conversacion + primer Mensaje
  // enlazada (el flujo exacto que definimos para el módulo de Comunicación).
  async create(dto: CreateRegistroDto, instructorId: string) {
    const alumno = await this.prisma.alumno.findUnique({
      where: { id: dto.alumnoId },
      include: { tutores: { where: { esPrincipal: true } } },
    });
    if (!alumno) throw new NotFoundException('Alumno no encontrado');

    let conversacionId: string | undefined;

    if (dto.notificarTutor) {
      const tutorPrincipal = alumno.tutores[0];
      if (!tutorPrincipal) throw new NotFoundException('El alumno no tiene un tutor principal asignado');

      const conversacion = await this.prisma.conversacion.create({
        data: {
          alumnoId: dto.alumnoId,
          tutorId: tutorPrincipal.tutorId,
          iniciadoPorId: instructorId,
          tipo: 'COMPORTAMIENTO',
          asunto: `Comportamiento - ${dto.categoria}`,
          mensajes: { create: { emisorId: instructorId, contenido: dto.descripcion } },
        },
      });
      conversacionId = conversacion.id;
    }

    return this.prisma.registroComportamiento.create({
      data: {
        alumnoId: dto.alumnoId,
        instructorId,
        tipo: dto.tipo as any,
        categoria: dto.categoria,
        descripcion: dto.descripcion,
        requiereSeguimiento: dto.requiereSeguimiento ?? false,
        conversacionId,
      },
    });
  }

  resolverSeguimiento(id: string) {
    return this.prisma.registroComportamiento.update({
      where: { id },
      data: { requiereSeguimiento: false },
    });
  }
}
