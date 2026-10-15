import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAtributoDto, UpdateAtributoDto } from './dto/atributo.dto';

@Injectable()
export class AtributosService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const atributos = await this.prisma.atributo.findMany({
      orderBy: { orden: 'asc' },
      include: { alumnosAsignados: { select: { alumnoId: true } } },
    });
    return atributos.map(({ alumnosAsignados, ...a }) => ({ ...a, alumnoIds: alumnosAsignados.map((x) => x.alumnoId) }));
  }

  create(data: CreateAtributoDto) {
    return this.prisma.atributo.create({ data: { ...data, alcance: (data.alcance as any) || 'GENERAL' } });
  }

  update(id: string, data: UpdateAtributoDto) {
    return this.prisma.atributo.update({ where: { id }, data });
  }

  // Reemplaza la lista de alumnos a los que aplica un atributo PERSONAL
  async asignarAlumnos(id: string, alumnoIds: string[]) {
    const atributo = await this.prisma.atributo.findUnique({ where: { id } });
    if (!atributo) throw new NotFoundException('Atributo no encontrado');
    if (atributo.alcance !== 'PERSONAL') throw new BadRequestException('Solo los atributos personales se asignan a alumnos');
    const unicos = [...new Set(alumnoIds)];
    await this.prisma.$transaction([
      this.prisma.atributoAlumno.deleteMany({ where: { atributoId: id } }),
      this.prisma.atributoAlumno.createMany({ data: unicos.map((alumnoId) => ({ atributoId: id, alumnoId })) }),
    ]);
    return { alumnoIds: unicos };
  }

  async remove(id: string) {
    const [viejos, mensuales] = await Promise.all([
      this.prisma.alumnoAtributoValor.count({ where: { atributoId: id } }),
      this.prisma.evaluacionValor.count({ where: { atributoId: id } }),
    ]);
    if (viejos + mensuales > 0) throw new NotFoundException('No se puede eliminar: ya tiene evaluaciones registradas');
    await this.prisma.atributoAlumno.deleteMany({ where: { atributoId: id } });
    return this.prisma.atributo.delete({ where: { id } });
  }
}
