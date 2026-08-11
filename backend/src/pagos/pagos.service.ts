import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePeriodoDto, AgregarCandidatosPagoDto, ActualizarPagoDto } from './dto/pago.dto';

@Injectable()
export class PagosService {
  constructor(private prisma: PrismaService) {}

  findAllPeriodos() {
    return this.prisma.periodoPago.findMany({
      include: { candidatos: { include: { alumno: true } } },
      orderBy: { fechaLimite: 'desc' },
    });
  }

  async findOnePeriodo(id: string) {
    const periodo = await this.prisma.periodoPago.findUnique({
      where: { id },
      include: { candidatos: { include: { alumno: true } } },
    });
    if (!periodo) throw new NotFoundException('Periodo de pago no encontrado');
    return periodo;
  }

  createPeriodo(data: CreatePeriodoDto) {
    return this.prisma.periodoPago.create({
      data: { ...data, fechaLimite: new Date(data.fechaLimite), estado: 'ABIERTO' },
    });
  }

  // Calcula cuánto le corresponde pagar a cada alumno: el default del periodo
  // más el costo extra de cada horario que NO sea su principal (ej. el grupo
  // extra de los sábados se suma aparte).
  async agregarCandidatos(periodoId: string, dto: AgregarCandidatosPagoDto) {
    const periodo = await this.prisma.periodoPago.findUnique({ where: { id: periodoId } });
    if (!periodo) throw new NotFoundException('Periodo de pago no encontrado');

    const alumnos = await this.prisma.alumno.findMany({
      where: { id: { in: dto.alumnoIds } },
      include: { horarios: { include: { horario: true } } },
    });

    return Promise.all(
      alumnos.map((alumno) => {
        const extras = alumno.horarios
          .filter((h) => !h.esPrincipal && h.horario.costoExtra)
          .reduce((sum, h) => sum + Number(h.horario.costoExtra), 0);
        const montoAPagar = Number(periodo.montoDefault) + extras;

        return this.prisma.periodoCandidato.upsert({
          where: { periodoId_alumnoId: { periodoId, alumnoId: alumno.id } },
          update: {},
          create: {
            periodoId,
            alumnoId: alumno.id,
            montoAPagar,
          },
        });
      }),
    );
  }

  actualizarPago(candidatoId: string, dto: ActualizarPagoDto) {
    return this.prisma.periodoCandidato.update({
      where: { id: candidatoId },
      data: {
        estadoPago: dto.estadoPago as any,
        metodoPago: dto.metodoPago,
        montoAPagar: dto.montoAPagar,
        fechaPago: dto.estadoPago === 'PAGADO' ? new Date() : undefined,
      },
    });
  }

  // Cancela o reactiva el periodo sin borrar nada (conserva el historial de pagos)
  updateEstadoPeriodo(id: string, estado?: string) {
    return this.prisma.periodoPago.update({ where: { id }, data: { estado } });
  }

  // Borra el periodo por completo, incluyendo a sus candidatos asociados (para
  // corregir un periodo creado por error)
  async removePeriodo(id: string) {
    await this.prisma.periodoCandidato.deleteMany({ where: { periodoId: id } });
    return this.prisma.periodoPago.delete({ where: { id } });
  }
}
