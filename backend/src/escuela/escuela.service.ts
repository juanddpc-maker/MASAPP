import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateEscuelaDto } from './dto/escuela.dto';

@Injectable()
export class EscuelaService {
  constructor(private prisma: PrismaService) {}

  // Configuración de escuela como fila única (singleton): si no existe, la crea con default.
  async obtener() {
    let escuela = await this.prisma.escuela.findFirst();
    if (!escuela) {
      escuela = await this.prisma.escuela.create({ data: {} });
    }
    return escuela;
  }

  async actualizar(dto: UpdateEscuelaDto) {
    const escuela = await this.obtener();
    return this.prisma.escuela.update({ where: { id: escuela.id }, data: dto });
  }
}
