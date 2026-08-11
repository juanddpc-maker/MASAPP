import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventoDto, AgregarCandidatosDto, ActualizarCandidatoDto, UpdateEventoDto } from './dto/evento.dto';

const includeCandidatos = {
  disciplina: true,
  candidatos: {
    include: {
      alumno: { include: { horarios: { include: { horario: true } } } },
    },
  },
};

@Injectable()
export class EventosService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.eventoCambioCinta.findMany({
      include: includeCandidatos,
      orderBy: { fechaExamen: 'desc' },
    });
  }

  async findOne(id: string) {
    const evento = await this.prisma.eventoCambioCinta.findUnique({ where: { id }, include: includeCandidatos });
    if (!evento) throw new NotFoundException('Evento no encontrado');
    return evento;
  }

  create(data: CreateEventoDto) {
    return this.prisma.eventoCambioCinta.create({
      data: { ...data, fechaExamen: new Date(data.fechaExamen) },
    });
  }

  // Cambia la fase del evento. Si la nueva fase es COMPLETADO, aplica de golpe
  // los cambios de cinta de todos los que aprobaron (ver completarEvento).
  async update(id: string, data: UpdateEventoDto) {
    if (data.estado === 'COMPLETADO') {
      return this.completarEvento(id);
    }
    return this.prisma.eventoCambioCinta.update({ where: { id }, data: data as any, include: includeCandidatos });
  }

  // Al completar el evento: por cada candidato que SÍ presentó examen y quedó APROBADO,
  // aplica su cambio de cinta (historial + cinta actual). Es seguro correrlo más de una
  // vez (usa upsert), por si se vuelve a marcar Completado.
  async completarEvento(id: string) {
    const evento = await this.prisma.eventoCambioCinta.findUnique({
      where: { id },
      include: { candidatos: { include: { alumno: true } } },
    });
    if (!evento) throw new NotFoundException('Evento no encontrado');

    const aprobados = evento.candidatos.filter((c) => c.presentaExamen && c.resultado === 'APROBADO');

    for (const candidato of aprobados) {
      const cinta = await this.prisma.cinta.findFirst({
        where: { nombre: candidato.cintaObjetivo, disciplinaId: evento.disciplinaId },
      });
      if (!cinta) continue; // salvaguarda por si el catálogo cambió entre medio

      await this.prisma.historialCinta.upsert({
        where: { eventoCandidatoId: candidato.id },
        update: { cintaId: cinta.id },
        create: { alumnoId: candidato.alumnoId, cintaId: cinta.id, eventoCandidatoId: candidato.id },
      });
      await this.prisma.alumno.update({
        where: { id: candidato.alumnoId },
        data: { cintaActualId: cinta.id, tallaCinta: candidato.tallaConfirmada || undefined },
      });
    }

    return this.prisma.eventoCambioCinta.update({
      where: { id },
      data: { estado: 'COMPLETADO' },
      include: includeCandidatos,
    });
  }

  // Agrega candidatos al evento, precargando la talla de cinta desde el perfil del alumno
  async agregarCandidatos(eventoId: string, dto: AgregarCandidatosDto) {
    const alumnos = await this.prisma.alumno.findMany({
      where: { id: { in: dto.alumnoIds } },
    });

    const creados = await Promise.all(
      alumnos.map((alumno) =>
        this.prisma.eventoCandidato.upsert({
          where: { eventoId_alumnoId: { eventoId, alumnoId: alumno.id } },
          update: {},
          create: {
            eventoId,
            alumnoId: alumno.id,
            cintaObjetivo: 'Por calcular',
            tallaCintaDefault: alumno.tallaCinta,
            tallaConfirmada: alumno.tallaCinta,
          },
        }),
      ),
    );
    return creados;
  }

  // Actualiza un candidato. Si resultado = APROBADO, SOLO calcula y guarda cuál sería
  // la siguiente cinta (para previsualizarla), pero NO toca el historial ni la cinta
  // actual del alumno todavía — eso se aplica hasta completar el evento.
  async actualizarCandidato(candidatoId: string, dto: ActualizarCandidatoDto) {
    const candidatoPrevio = await this.prisma.eventoCandidato.findUnique({
      where: { id: candidatoId },
      include: { alumno: true, evento: true },
    });
    if (!candidatoPrevio) throw new NotFoundException('Candidato no encontrado');

    if (candidatoPrevio.evento.estado === 'COMPLETADO') {
      throw new BadRequestException('Este evento ya está completado y no se puede modificar');
    }

    let cintaSiguienteNombre: string | undefined;

    if (dto.resultado === 'APROBADO') {
      const cintaActual = candidatoPrevio.alumno.cintaActualId
        ? await this.prisma.cinta.findUnique({ where: { id: candidatoPrevio.alumno.cintaActualId } })
        : null;
      const ordenActual = cintaActual?.orden ?? -1;

      const siguienteCinta = await this.prisma.cinta.findFirst({
        where: { disciplinaId: candidatoPrevio.evento.disciplinaId, orden: { gt: ordenActual } },
        orderBy: { orden: 'asc' },
      });

      if (!siguienteCinta) {
        throw new BadRequestException('Este alumno ya está en la cinta más alta del catálogo de esta disciplina');
      }
      cintaSiguienteNombre = siguienteCinta.nombre;
    }

    return this.prisma.eventoCandidato.update({
      where: { id: candidatoId },
      data: {
        cintaObjetivo: cintaSiguienteNombre ?? candidatoPrevio.cintaObjetivo,
        tallaConfirmada: dto.tallaConfirmada,
        tutorConfirmo: dto.tutorConfirmo,
        presentaExamen: dto.presentaExamen,
        resultado: dto.resultado as any,
        pagoExamen: dto.pagoExamen,
        notas: dto.notas,
        fechaConfirmacion: dto.tutorConfirmo ? new Date() : undefined,
      },
      include: { alumno: true },
    });
  }

  // Solo actualiza la talla, sin tocar resultado (para poder corregirla en cualquier momento)
  actualizarTalla(candidatoId: string, tallaConfirmada: string) {
    return this.prisma.eventoCandidato.update({
      where: { id: candidatoId },
      data: { tallaConfirmada },
    });
  }

  // Borra el evento y sus candidatos asociados (para corregir un evento creado por error)
  async remove(id: string) {
    await this.prisma.eventoCandidato.deleteMany({ where: { eventoId: id } });
    return this.prisma.eventoCambioCinta.delete({ where: { id } });
  }
}
