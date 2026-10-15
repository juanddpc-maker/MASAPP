import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePeriodoDto, UpdatePeriodoDto } from './dto/evaluacion-mensual.dto';

@Injectable()
export class PeriodosService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.periodoEvaluacion.findMany({
      orderBy: { fechaInicio: 'desc' },
      include: { _count: { select: { evaluaciones: true } } },
    });
  }

  create(dto: CreatePeriodoDto) {
    const inicio = new Date(dto.fechaInicio);
    const fin = new Date(dto.fechaFin);
    if (fin < inicio) throw new BadRequestException('La fecha fin no puede ser anterior al inicio');
    return this.prisma.periodoEvaluacion.create({
      data: { nombre: dto.nombre.trim(), fechaInicio: inicio, fechaFin: fin },
    });
  }

  async update(id: string, dto: UpdatePeriodoDto) {
    const actual = await this.prisma.periodoEvaluacion.findUnique({ where: { id } });
    if (!actual) throw new NotFoundException('Periodo no encontrado');
    const inicio = dto.fechaInicio ? new Date(dto.fechaInicio) : actual.fechaInicio;
    const fin = dto.fechaFin ? new Date(dto.fechaFin) : actual.fechaFin;
    if (fin < inicio) throw new BadRequestException('La fecha fin no puede ser anterior al inicio');
    return this.prisma.periodoEvaluacion.update({
      where: { id },
      data: { nombre: dto.nombre?.trim(), fechaInicio: inicio, fechaFin: fin, estado: dto.estado as any },
    });
  }

  async remove(id: string) {
    const usado = await this.prisma.evaluacionMensual.count({ where: { periodoId: id } });
    if (usado > 0) {
      throw new BadRequestException('Este periodo ya tiene evaluaciones. Ciérralo en lugar de eliminarlo.');
    }
    return this.prisma.periodoEvaluacion.delete({ where: { id } });
  }
}
