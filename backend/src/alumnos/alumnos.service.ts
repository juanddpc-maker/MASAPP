import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlumnoDto } from './dto/create-alumno.dto';
import { UpdateAlumnoDto, UpdateTutoresAlumnoDto, UpdateHorariosAlumnoDto } from './dto/update-alumno.dto';

const includeCompleto = {
  tutores: { include: { tutor: true } },
  horarios: { include: { horario: { include: { disciplina: true } } } },
  cintaActual: true,
};

@Injectable()
export class AlumnosService {
  constructor(private prisma: PrismaService) {}

  async findAll(usuario: any) {
    if (usuario.rol === 'TUTOR') {
      return this.prisma.alumno.findMany({
        where: { tutores: { some: { tutorId: usuario.tutorId } } },
        include: includeCompleto,
      });
    }
    return this.prisma.alumno.findMany({ include: includeCompleto });
  }

  async findOne(id: string, usuario: any) {
    const alumno = await this.prisma.alumno.findUnique({
      where: { id },
      include: { ...includeCompleto, historialCintas: { include: { cinta: true }, orderBy: { fechaObtencion: 'desc' } } },
    });
    if (!alumno) throw new NotFoundException('Alumno no encontrado');

    if (usuario.rol === 'TUTOR' && !alumno.tutores.some((t) => t.tutorId === usuario.tutorId)) {
      throw new ForbiddenException('No tienes acceso a este alumno');
    }
    return alumno;
  }

  async create(data: CreateAlumnoDto) {
    const { tutorIds, tutorPrincipalId, horarioIds, horarioPrincipalId, cintaActualId, ...resto } = data;

    // Si no se especifica cinta actual, se asigna la más baja de la disciplina del horario principal
    let cintaInicialId = cintaActualId;
    if (!cintaInicialId) {
      const idPrincipal = horarioPrincipalId || horarioIds[0];
      const horario = await this.prisma.horario.findUnique({ where: { id: idPrincipal } });
      if (horario) {
        const cintaBase = await this.prisma.cinta.findFirst({
          where: { disciplinaId: horario.disciplinaId },
          orderBy: { orden: 'asc' },
        });
        cintaInicialId = cintaBase?.id;
      }
    }

    return this.prisma.alumno.create({
      data: {
        ...resto,
        genero: resto.genero as any,
        fechaNacimiento: new Date(data.fechaNacimiento),
        fechaInscripcion: data.fechaInscripcion ? new Date(data.fechaInscripcion) : new Date(),
        cintaActualId: cintaInicialId,
        tutores: {
          create: tutorIds.map((tutorId) => ({
            tutorId,
            esPrincipal: tutorId === (tutorPrincipalId || tutorIds[0]),
          })),
        },
        horarios: {
          create: horarioIds.map((horarioId) => ({
            horarioId,
            esPrincipal: horarioId === (horarioPrincipalId || horarioIds[0]),
          })),
        },
      },
      include: includeCompleto,
    });
  }

  update(id: string, data: UpdateAlumnoDto) {
    const payload: any = { ...data };
    if (data.fechaNacimiento) payload.fechaNacimiento = new Date(data.fechaNacimiento);
    if (data.fechaInscripcion) payload.fechaInscripcion = new Date(data.fechaInscripcion);
    // Un select vacío no debe mandar un id vacío a Prisma
    if (payload.cintaActualId === '') delete payload.cintaActualId;
    return this.prisma.alumno.update({ where: { id }, data: payload, include: includeCompleto });
  }

  async updateTutores(id: string, dto: UpdateTutoresAlumnoDto) {
    await this.prisma.alumnoTutor.deleteMany({ where: { alumnoId: id } });
    return this.prisma.alumno.update({
      where: { id },
      data: {
        tutores: {
          create: dto.tutorIds.map((tutorId) => ({
            tutorId,
            esPrincipal: tutorId === (dto.tutorPrincipalId || dto.tutorIds[0]),
          })),
        },
      },
      include: includeCompleto,
    });
  }

  async updateHorarios(id: string, dto: UpdateHorariosAlumnoDto) {
    await this.prisma.alumnoHorario.deleteMany({ where: { alumnoId: id } });
    return this.prisma.alumno.update({
      where: { id },
      data: {
        horarios: {
          create: dto.horarioIds.map((horarioId) => ({
            horarioId,
            esPrincipal: horarioId === (dto.horarioPrincipalId || dto.horarioIds[0]),
          })),
        },
      },
      include: includeCompleto,
    });
  }

  remove(id: string) {
    return this.prisma.alumno.update({ where: { id }, data: { estado: 'INACTIVO' } });
  }
}
