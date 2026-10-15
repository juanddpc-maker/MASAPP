import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarcarAsistenciaDto } from './dto/asistencia.dto';

function inicioDelDia(fechaTexto: string): Date {
  // Normaliza a medianoche para que "la misma fecha" siempre encuentre la misma sesión,
  // sin importar a qué hora del día se abra o se retome.
  const f = new Date(fechaTexto);
  f.setHours(0, 0, 0, 0);
  return f;
}

@Injectable()
export class AsistenciaService {
  constructor(private prisma: PrismaService) {}

  // Trae (o crea) la sesión de ese horario+fecha, junto con los alumnos activos
  // de ese horario y su estado de asistencia actual (si ya se había marcado antes,
  // por ejemplo si el instructor salió y volvió a entrar).
  async obtenerSesion(horarioId: string, fechaTexto: string) {
    const fecha = inicioDelDia(fechaTexto);

    const sesion = await this.prisma.sesionAsistencia.upsert({
      where: { horarioId_fecha: { horarioId, fecha } },
      update: {},
      create: { horarioId, fecha },
      include: { registros: true },
    });

    const alumnos = await this.prisma.alumno.findMany({
      where: { estado: 'ACTIVO', horarios: { some: { horarioId } } },
      orderBy: { nombreCompleto: 'asc' },
    });

    const alumnosConEstado = alumnos.map((a) => {
      const registro = sesion.registros.find((r) => r.alumnoId === a.id);
      return {
        id: a.id,
        nombreCompleto: a.nombreCompleto,
        estado: registro?.estado ?? null,
        horaMarcado: registro?.horaMarcado ?? null,
      };
    });

    return { sesionId: sesion.id, horarioId, fecha: sesion.fecha, alumnos: alumnosConEstado };
  }

  // Marca (o desmarca, si no se manda estado) a un alumno dentro de la sesión de ese día
  async marcar(dto: MarcarAsistenciaDto) {
    const fecha = inicioDelDia(dto.fecha);

    const sesion = await this.prisma.sesionAsistencia.upsert({
      where: { horarioId_fecha: { horarioId: dto.horarioId, fecha } },
      update: {},
      create: { horarioId: dto.horarioId, fecha },
    });

    if (!dto.estado) {
      // Desmarcar: borra el registro, el alumno vuelve a quedar como "ausente" (sin registro)
      await this.prisma.asistenciaAlumno.deleteMany({
        where: { sesionId: sesion.id, alumnoId: dto.alumnoId },
      });
      return { ok: true };
    }

    return this.prisma.asistenciaAlumno.upsert({
      where: { sesionId_alumnoId: { sesionId: sesion.id, alumnoId: dto.alumnoId } },
      update: { estado: dto.estado as any, horaMarcado: new Date() },
      create: { sesionId: sesion.id, alumnoId: dto.alumnoId, estado: dto.estado as any },
    });
  }

  // Sesiones pasadas de un horario, para poder revisar o corregir asistencias anteriores
  findHistorialPorHorario(horarioId: string) {
    return this.prisma.sesionAsistencia.findMany({
      where: { horarioId },
      include: { registros: true },
      orderBy: { fecha: 'desc' },
      take: 30,
    });
  }
}
