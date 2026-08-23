import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEvaluacionDto } from './dto/evaluacion.dto';

@Injectable()
export class EvaluacionesService {
  constructor(private prisma: PrismaService) {}

  // Historial completo de un alumno (todas las evaluaciones, más reciente primero)
  findHistorial(alumnoId: string) {
    return this.prisma.alumnoAtributoValor.findMany({
      where: { alumnoId },
      include: { atributo: true },
      orderBy: { fecha: 'desc' },
    });
  }

  // Para el radar: el valor MÁS RECIENTE de cada atributo del catálogo (0 si nunca se ha evaluado)
  async valoresActuales(alumnoId: string) {
    const atributos = await this.prisma.atributo.findMany({ orderBy: { orden: 'asc' } });
    const historial = await this.prisma.alumnoAtributoValor.findMany({
      where: { alumnoId },
      orderBy: { fecha: 'desc' },
    });

    return atributos.map((a) => {
      const ultimo = historial.find((h) => h.atributoId === a.id);
      return { atributoId: a.id, nombre: a.nombre, valor: ultimo?.valor ?? 0 };
    });
  }

  create(dto: CreateEvaluacionDto, usuarioId: string) {
    return this.prisma.alumnoAtributoValor.create({
      data: { ...dto, registradoPorId: usuarioId },
      include: { atributo: true },
    });
  }
}
