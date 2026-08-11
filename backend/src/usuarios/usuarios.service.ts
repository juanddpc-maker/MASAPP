import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto, UpdateUsuarioDto } from './dto/usuario.dto';

function generarPasswordTemporal() {
  return Math.random().toString(36).slice(-8);
}

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.usuario.findMany({
      select: { id: true, nombre: true, correo: true, rol: true, activo: true, createdAt: true },
    });
  }

  async findOne(id: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: { id: true, nombre: true, correo: true, rol: true, activo: true },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return usuario;
  }

  async create(data: CreateUsuarioDto) {
    const existe = await this.prisma.usuario.findUnique({ where: { correo: data.correo } });
    if (existe) throw new ConflictException('Ya existe un usuario con ese correo');

    const passwordHash = await bcrypt.hash(data.password, 10);
    const usuario = await this.prisma.usuario.create({
      data: {
        nombre: data.nombre,
        correo: data.correo,
        passwordHash,
        rol: data.rol as any,
        tutorId: data.tutorId,
      },
    });
    const { passwordHash: _omit, ...resto } = usuario;
    return resto;
  }

  async update(id: string, data: UpdateUsuarioDto) {
    if (data.correo) {
      const existe = await this.prisma.usuario.findUnique({ where: { correo: data.correo } });
      if (existe && existe.id !== id) throw new ConflictException('Ya existe un usuario con ese correo');
    }
    return this.prisma.usuario.update({ where: { id }, data: data as any });
  }

  // Baja lógica: nunca se borra un usuario, se desactiva (preserva historial de quién hizo qué)
  remove(id: string) {
    return this.prisma.usuario.update({ where: { id }, data: { activo: false } });
  }

  // Genera una nueva contraseña temporal. Sirve tanto para "olvidé mi contraseña"
  // como para el flujo de "regenerar acceso" de un tutor.
  async resetPassword(id: string) {
    const passwordTemporal = generarPasswordTemporal();
    const passwordHash = await bcrypt.hash(passwordTemporal, 10);
    const usuario = await this.prisma.usuario.update({ where: { id }, data: { passwordHash } });
    return { correo: usuario.correo, passwordTemporal };
  }
}
