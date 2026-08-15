import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

// Rutas que NO se cuentan como "uso de módulo" (login ya tiene su propio log,
// y el conteo de no-leídos se dispara solo, no representa una acción real del usuario)
const MODULOS_EXCLUIDOS = ['auth', 'logs'];

@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap(() => {
        // Se registra DESPUÉS de responder, y sin esperar (no debe ralentizar la respuesta al usuario)
        const partes = (req.url || '').split('/').filter(Boolean); // ["api", "alumnos", "123"]
        const modulo = partes[1];
        if (!modulo || MODULOS_EXCLUIDOS.includes(modulo)) return;

        this.prisma.requestLog
          .create({
            data: {
              usuarioId: req.user?.userId,
              nombre: req.user?.correo,
              modulo,
              metodo: req.method,
            },
          })
          .catch(() => {});
      }),
    );
  }
}
