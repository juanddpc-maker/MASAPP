import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GuardarEvaluacionDto } from './dto/evaluacion-mensual.dto';

const prom = (nums: number[]) =>
  nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : null;

@Injectable()
export class EvaluacionMensualService {
  constructor(private prisma: PrismaService) {}

  // Atributos que se le evalúan a un alumno: todos los generales + los personales que tenga asignados
  async atributosDeAlumno(alumnoId: string) {
    return this.prisma.atributo.findMany({
      where: {
        OR: [{ alcance: 'GENERAL' }, { alcance: 'PERSONAL', alumnosAsignados: { some: { alumnoId } } }],
      },
      orderBy: [{ alcance: 'asc' }, { orden: 'asc' }],
      select: { id: true, nombre: true, alcance: true },
    });
  }

  // Alumnos activos de la clase y si ya tienen evaluación en el periodo
  async clase(periodoId: string, horarioId: string) {
    const alumnos = await this.prisma.alumno.findMany({
      where: { estado: 'ACTIVO', horarios: { some: { horarioId } } },
      orderBy: { nombreCompleto: 'asc' },
      select: { id: true, nombreCompleto: true },
    });
    const evaluaciones = await this.prisma.evaluacionMensual.findMany({
      where: { periodoId, alumnoId: { in: alumnos.map((a) => a.id) } },
      include: { valores: true },
    });
    return alumnos.map((a) => {
      const ev = evaluaciones.find((e) => e.alumnoId === a.id);
      return {
        id: a.id,
        nombreCompleto: a.nombreCompleto,
        evaluado: !!ev,
        promedio: ev ? prom(ev.valores.map((v) => v.valor)) : null,
      };
    });
  }

  async formulario(periodoId: string, alumnoId: string) {
    const [atributos, ev] = await Promise.all([
      this.atributosDeAlumno(alumnoId),
      this.prisma.evaluacionMensual.findUnique({
        where: { periodoId_alumnoId: { periodoId, alumnoId } },
        include: { valores: true },
      }),
    ]);
    return {
      atributos,
      evaluacion: ev
        ? { notas: ev.notas, valores: Object.fromEntries(ev.valores.map((v) => [v.atributoId, v.valor])) }
        : null,
    };
  }

  async guardar(dto: GuardarEvaluacionDto, usuarioId: string) {
    const periodo = await this.prisma.periodoEvaluacion.findUnique({ where: { id: dto.periodoId } });
    if (!periodo) throw new NotFoundException('Periodo no encontrado');
    if (periodo.estado !== 'ABIERTO') throw new BadRequestException('Este periodo está cerrado');

    const alumno = await this.prisma.alumno.findUnique({ where: { id: dto.alumnoId } });
    if (!alumno) throw new NotFoundException('Alumno no encontrado');

    const permitidos = new Set((await this.atributosDeAlumno(dto.alumnoId)).map((a) => a.id));
    const vistos = new Set<string>();
    for (const v of dto.valores) {
      if (!permitidos.has(v.atributoId)) throw new BadRequestException('Hay un atributo que no aplica a este alumno');
      if (vistos.has(v.atributoId)) throw new BadRequestException('Atributo repetido');
      vistos.add(v.atributoId);
    }

    return this.prisma.$transaction(async (tx) => {
      const ev = await tx.evaluacionMensual.upsert({
        where: { periodoId_alumnoId: { periodoId: dto.periodoId, alumnoId: dto.alumnoId } },
        update: { notas: dto.notas?.trim() || null, instructorId: usuarioId },
        create: { periodoId: dto.periodoId, alumnoId: dto.alumnoId, notas: dto.notas?.trim() || null, instructorId: usuarioId },
      });
      await tx.evaluacionValor.deleteMany({ where: { evaluacionId: ev.id } });
      await tx.evaluacionValor.createMany({
        data: dto.valores.map((v) => ({ evaluacionId: ev.id, atributoId: v.atributoId, valor: v.valor })),
      });
      return { id: ev.id, promedio: prom(dto.valores.map((v) => v.valor)) };
    });
  }

  // Progreso del alumno: una fila por periodo (más antiguo primero) con promedios
  async progreso(alumnoId: string) {
    const evaluaciones = await this.prisma.evaluacionMensual.findMany({
      where: { alumnoId },
      include: { periodo: true, valores: { include: { atributo: true } } },
    });
    evaluaciones.sort((a, b) => a.periodo.fechaInicio.getTime() - b.periodo.fechaInicio.getTime());

    return evaluaciones.map((e) => {
      const valores = e.valores.map((v) => ({
        atributoId: v.atributoId,
        nombre: v.atributo.nombre,
        alcance: v.atributo.alcance,
        valor: v.valor,
      }));
      return {
        id: e.id,
        periodoId: e.periodoId,
        periodo: e.periodo.nombre,
        fechaInicio: e.periodo.fechaInicio,
        notas: e.notas,
        valores,
        promedio: prom(valores.map((v) => v.valor)),
        promedioGeneral: prom(valores.filter((v) => v.alcance === 'GENERAL').map((v) => v.valor)),
        promedioPersonal: prom(valores.filter((v) => v.alcance === 'PERSONAL').map((v) => v.valor)),
      };
    });
  }
}
