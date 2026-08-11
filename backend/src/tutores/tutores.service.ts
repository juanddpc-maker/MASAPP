import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTutorDto, UpdateTutorDto, GenerarAccesoDto } from './dto/tutor.dto';

function generarPasswordTemporal() {
  return Math.random().toString(36).slice(-8);
}

const includeCompleto = {
  usuario: true,
  alumnos: {
    include: {
      alumno: {
        include: {
          cintaActual: true,
          horarios: { include: { horario: { include: { disciplina: true } } } },
        },
      },
    },
  },
};

@Injectable()
export class TutoresService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.tutor.findMany({ include: includeCompleto });
  }

  async findOne(id: string) {
    const tutor = await this.prisma.tutor.findUnique({ where: { id }, include: includeCompleto });
    if (!tutor) throw new NotFoundException('Tutor no encontrado');
    return tutor;
  }

  // Ya NO crea acceso automático. El correo aquí es solo de contacto.
  create(data: CreateTutorDto) {
    return this.prisma.tutor.create({ data, include: includeCompleto });
  }

  update(id: string, data: UpdateTutorDto) {
    return this.prisma.tutor.update({ where: { id }, data, include: includeCompleto });
  }

  // Genera el acceso al sistema por separado, con su propio correo de login
  // (puede ser distinto al correo de contacto del tutor).
  async generarAcceso(id: string, dto: GenerarAccesoDto) {
    const tutor = await this.prisma.tutor.findUnique({ where: { id }, include: { usuario: true } });
    if (!tutor) throw new NotFoundException('Tutor no encontrado');
    if (tutor.usuario) throw new ConflictException('Este tutor ya tiene acceso al sistema');

    const correoExistente = await this.prisma.usuario.findUnique({ where: { correo: dto.correo } });
    if (correoExistente) throw new ConflictException('Ya existe un usuario con ese correo de acceso');

    const passwordTemporal = generarPasswordTemporal();
    const passwordHash = await bcrypt.hash(passwordTemporal, 10);

    await this.prisma.usuario.create({
      data: {
        nombre: tutor.nombre,
        correo: dto.correo,
        passwordHash,
        rol: 'TUTOR',
        tutorId: tutor.id,
      },
    });

    return { correo: dto.correo, passwordTemporal };
  }

  async remove(id: string) {
    const alumnosActivos = await this.prisma.alumnoTutor.count({
      where: { tutorId: id, alumno: { estado: 'ACTIVO' } },
    });
    if (alumnosActivos > 0) {
      throw new NotFoundException('No se puede desactivar: el tutor tiene alumnos activos asociados');
    }
    return this.prisma.tutor.update({ where: { id }, data: { activo: false } });
  }
}
