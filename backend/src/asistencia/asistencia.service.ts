import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarcarAsistenciaDto } from './dto/asistencia.dto';

function inicioDelDia(fechaTexto: string): Date {
  // Normaliza a medianoche para que "la misma fecha" siempre encuentre la misma sesión,
  // sin importar a qué hora del día se abra o se retome.
  // Se fija en UTC para que el día sea el mismo en cualquier computadora o servidor
  // (antes dependía de la zona horaria de donde corriera el backend).
  if (/^\d{4}-\d{2}-\d{2}$/.test(fechaTexto)) return new Date(`${fechaTexto}T00:00:00.000Z`);
  const f = new Date(fechaTexto);
  f.setUTCHours(0, 0, 0, 0);
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

  // Resumen de asistencia de un alumno: por mes (asistió / retardo / falta) y los últimos 30 días.
  // Una "falta" es una clase que ya tiene sesión abierta en la que el alumno no quedó marcado.
  // Solo cuentan las sesiones desde la fecha de inscripción del alumno.
  async resumen(alumnoId: string, usuario: any, mesesTexto?: string) {
    const alumno = await this.prisma.alumno.findUnique({
      where: { id: alumnoId },
      include: { tutores: true, horarios: true },
    });
    if (!alumno) throw new NotFoundException('Alumno no encontrado');
    if (usuario.rol === 'TUTOR' && !alumno.tutores.some((t) => t.tutorId === usuario.tutorId)) {
      throw new ForbiddenException('No tienes acceso a este alumno');
    }

    const n = Math.min(Math.max(parseInt(mesesTexto || '6', 10) || 6, 1), 24);
    const hoy = new Date();
    const inicioVentana = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() - (n - 1), 1));
    const inscripcion = new Date(alumno.fechaInscripcion);
    inscripcion.setUTCHours(0, 0, 0, 0);
    const desde = inscripcion > inicioVentana ? inscripcion : inicioVentana;

    const sesiones = await this.prisma.sesionAsistencia.findMany({
      where: { horarioId: { in: alumno.horarios.map((h) => h.horarioId) }, fecha: { gte: desde } },
      include: { registros: { where: { alumnoId } } },
    });

    // Un renglón por mes de la ventana, aunque no haya clases (para que la gráfica no tenga huecos)
    const meses = new Map<string, { mes: string; presentes: number; retardos: number; faltas: number; sesiones: number }>();
    for (let i = 0; i < n; i++) {
      const d = new Date(Date.UTC(inicioVentana.getUTCFullYear(), inicioVentana.getUTCMonth() + i, 1));
      const mes = d.toISOString().slice(0, 7);
      meses.set(mes, { mes, presentes: 0, retardos: 0, faltas: 0, sesiones: 0 });
    }

    const hace30 = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate() - 30));
    const u30 = { sesiones: 0, asistencias: 0, retardos: 0 };

    for (const s of sesiones) {
      const fila = meses.get(s.fecha.toISOString().slice(0, 7));
      if (!fila) continue;
      const estado = s.registros[0]?.estado;
      fila.sesiones++;
      if (estado === 'PRESENTE') fila.presentes++;
      else if (estado === 'RETARDO') fila.retardos++;
      else fila.faltas++;

      if (s.fecha >= hace30) {
        u30.sesiones++;
        if (estado) u30.asistencias++; // el retardo también cuenta como asistencia
        if (estado === 'RETARDO') u30.retardos++;
      }
    }

    const lista = [...meses.values()];
    const total = lista.reduce(
      (a, m) => ({ sesiones: a.sesiones + m.sesiones, presentes: a.presentes + m.presentes, retardos: a.retardos + m.retardos, faltas: a.faltas + m.faltas }),
      { sesiones: 0, presentes: 0, retardos: 0, faltas: 0 },
    );

    return {
      meses: lista,
      total,
      ultimos30: {
        sesiones: u30.sesiones,
        asistencias: u30.asistencias,
        retardos: u30.retardos,
        porcentaje: u30.sesiones ? Math.round((u30.asistencias / u30.sesiones) * 100) : null,
      },
    };
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
