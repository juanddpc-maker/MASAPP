import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LogsService {
  constructor(private prisma: PrismaService) {}

  findLoginLogs() {
    return this.prisma.loginLog.findMany({ orderBy: { fecha: 'desc' }, take: 200 });
  }

  // Cuenta cuántas peticiones tiene cada módulo, para la gráfica de "más usados"
  async usoPorModulo() {
    const conteos = await this.prisma.requestLog.groupBy({
      by: ['modulo'],
      _count: { _all: true },
    });
    return conteos
      .map((c) => ({ modulo: c.modulo, cantidad: c._count._all }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }
}
