import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateConversacionDto, CreateMensajeDto, UpdateConversacionDto } from './dto/comunicacion.dto';

@Injectable()
export class ComunicacionService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  // El tutor solo ve sus propias conversaciones; instructor/admin ven todas
  findAll(usuario: any) {
    return this.prisma.conversacion.findMany({
      where: usuario.rol === 'TUTOR' ? { tutorId: usuario.tutorId } : undefined,
      include: { alumno: true, tutor: true, mensajes: { orderBy: { fechaEnvio: 'asc' } } },
      orderBy: { fechaUltimaActividad: 'desc' },
    });
  }

  async findOne(id: string, usuario: any) {
    const conversacion = await this.prisma.conversacion.findUnique({
      where: { id },
      include: { mensajes: { orderBy: { fechaEnvio: 'asc' }, include: { emisor: true } } },
    });
    if (!conversacion) throw new NotFoundException('Conversación no encontrada');
    if (usuario.rol === 'TUTOR' && conversacion.tutorId !== usuario.tutorId) {
      throw new ForbiddenException('No tienes acceso a esta conversación');
    }

    // Al abrir la conversación, se marcan como leídos los mensajes que no escribió el propio usuario
    await this.prisma.mensaje.updateMany({
      where: { conversacionId: id, leido: false, emisorId: { not: usuario.userId } },
      data: { leido: true, fechaLectura: new Date() },
    });

    return conversacion;
  }

  // Cuántos mensajes tiene pendientes de leer el tutor logueado (para el aviso al iniciar sesión)
  async contarNoLeidos(usuario: any) {
    if (usuario.rol !== 'TUTOR') return { total: 0 };
    const total = await this.prisma.mensaje.count({
      where: {
        leido: false,
        emisorId: { not: usuario.userId },
        conversacion: { tutorId: usuario.tutorId },
      },
    });
    return { total };
  }

  // Crea la conversación con su primer mensaje. Puede iniciarla un instructor/admin
  // (avisa por correo al tutor) o el propio tutor (avisa por correo a los administradores).
  async create(data: CreateConversacionDto, usuario: any) {
    // Si quien inicia es un tutor, se usa SIEMPRE su propio tutorId (nunca el que
    // venga del frontend), para que no pueda escribir "a nombre" de otro tutor.
    const tutorId = usuario.rol === 'TUTOR' ? usuario.tutorId : data.tutorId;
    if (!tutorId) throw new BadRequestException('Falta indicar a qué tutor va dirigida la conversación');

    const conversacion = await this.prisma.conversacion.create({
      data: {
        alumnoId: data.alumnoId,
        tutorId,
        iniciadoPorId: usuario.userId,
        tipo: data.tipo as any,
        asunto: data.asunto,
        mensajes: { create: { emisorId: usuario.userId, contenido: data.contenidoInicial } },
      },
      include: {
        mensajes: true,
        alumno: true,
        tutor: { include: { usuario: true } },
      },
    });

    if (usuario.rol === 'TUTOR') {
      // Avisa a todos los administradores activos
      const admins = await this.prisma.usuario.findMany({ where: { rol: 'ADMINISTRADOR', activo: true } });
      await Promise.all(
        admins.map((admin) =>
          this.emailService.sendMail(
            admin.correo,
            `${conversacion.asunto} — ${conversacion.alumno.nombreCompleto} (de ${conversacion.tutor.nombre})`,
            `<p>Hola ${admin.nombre},</p>
             <p><strong>${conversacion.tutor.nombre}</strong> (tutor de ${conversacion.alumno.nombreCompleto}) inició una conversación:</p>
             <p style="padding:12px;background:#f5f5f4;border-radius:8px;">${data.contenidoInicial}</p>
             <p>Ingresa a la plataforma para responder.</p>`,
          ),
        ),
      );
    } else {
      const correoDestino = conversacion.tutor.correo || conversacion.tutor.usuario?.correo;
      if (correoDestino) {
        await this.emailService.sendMail(
          correoDestino,
          `${conversacion.asunto} — ${conversacion.alumno.nombreCompleto}`,
          `<p>Hola ${conversacion.tutor.nombre},</p>
           <p>Se inició una conversación sobre <strong>${conversacion.alumno.nombreCompleto}</strong>:</p>
           <p style="padding:12px;background:#f5f5f4;border-radius:8px;">${data.contenidoInicial}</p>
           <p>Ingresa a la plataforma para responder.</p>`,
        );
      }
    }

    return conversacion;
  }

  async responder(conversacionId: string, dto: CreateMensajeDto, usuarioId: string) {
    const mensaje = await this.prisma.mensaje.create({
      data: { conversacionId, emisorId: usuarioId, contenido: dto.contenido },
    });
    await this.prisma.conversacion.update({
      where: { id: conversacionId },
      data: { fechaUltimaActividad: new Date() },
    });
    return mensaje;
  }

  update(id: string, data: UpdateConversacionDto) {
    return this.prisma.conversacion.update({ where: { id }, data: data as any });
  }
}
