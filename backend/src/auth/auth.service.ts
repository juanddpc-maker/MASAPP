import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(correo: string, password: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { correo } });
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValido = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordValido) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = {
      sub: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol,
      tutorId: usuario.tutorId,
    };

    // No bloquea el login si falla el registro del log — es informativo, no crítico
    this.prisma.loginLog
      .create({ data: { usuarioId: usuario.id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol } })
      .catch(() => {});

    return {
      access_token: this.jwt.sign(payload),
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    };
  }

  // Cualquier usuario logueado puede cambiar su propia contraseña, siempre
  // que confirme la actual (para que nadie con la sesión abierta la cambie sin permiso).
  async changePassword(usuarioId: string, passwordActual: string, passwordNueva: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) throw new UnauthorizedException();

    const passwordValido = await bcrypt.compare(passwordActual, usuario.passwordHash);
    if (!passwordValido) throw new BadRequestException('La contraseña actual no es correcta');

    if (passwordNueva.length < 6) throw new BadRequestException('La nueva contraseña debe tener al menos 6 caracteres');

    const passwordHash = await bcrypt.hash(passwordNueva, 10);
    await this.prisma.usuario.update({ where: { id: usuarioId }, data: { passwordHash } });
    return { ok: true };
  }
}
