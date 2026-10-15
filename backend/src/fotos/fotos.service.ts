import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './storage.service';
import { CreateFotoDto } from './dto/foto.dto';

const TIPOS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_BYTES = 3 * 1024 * 1024; // el navegador ya reduce la imagen; esto es un tope de seguridad

@Injectable()
export class FotosService {
  constructor(private prisma: PrismaService, private storage: StorageService) {}

  private async verificarAcceso(alumnoId: string, usuario: any) {
    const alumno = await this.prisma.alumno.findUnique({ where: { id: alumnoId }, include: { tutores: true } });
    if (!alumno) throw new NotFoundException('Alumno no encontrado');
    if (usuario.rol === 'TUTOR' && !alumno.tutores.some((t) => t.tutorId === usuario.tutorId)) {
      throw new ForbiddenException('No tienes acceso a este alumno');
    }
  }

  async findByAlumno(alumnoId: string, usuario: any) {
    await this.verificarAcceso(alumnoId, usuario);
    const fotos = await this.prisma.fotoAlumno.findMany({ where: { alumnoId }, orderBy: { fecha: 'desc' } });
    const urls = await this.storage.urlsFirmadas(fotos.map((f) => f.ruta));
    return fotos.map((f) => ({ id: f.id, fecha: f.fecha, nota: f.nota, url: urls[f.ruta] || null }));
  }

  async create(dto: CreateFotoDto, file: any) {
    if (!file) throw new BadRequestException('Falta la foto');
    const ext = TIPOS[file.mimetype];
    if (!ext) throw new BadRequestException('Formato no permitido (usa JPG, PNG o WEBP)');
    if (file.size > MAX_BYTES) throw new BadRequestException('La foto es demasiado grande');
    const alumno = await this.prisma.alumno.findUnique({ where: { id: dto.alumnoId } });
    if (!alumno) throw new NotFoundException('Alumno no encontrado');

    const ruta = `${dto.alumnoId}/${randomUUID()}.${ext}`;
    await this.storage.subir(ruta, file.buffer, file.mimetype);
    try {
      return await this.prisma.fotoAlumno.create({
        data: { alumnoId: dto.alumnoId, ruta, fecha: dto.fecha ? new Date(dto.fecha) : new Date(), nota: dto.nota?.trim() || null },
      });
    } catch (e) {
      await this.storage.borrar(ruta); // no dejar archivos huérfanos si falla la base
      throw e;
    }
  }

  async remove(id: string) {
    const foto = await this.prisma.fotoAlumno.findUnique({ where: { id } });
    if (!foto) throw new NotFoundException('Foto no encontrada');
    await this.prisma.fotoAlumno.delete({ where: { id } });
    await this.storage.borrar(foto.ruta);
    return { ok: true };
  }
}
