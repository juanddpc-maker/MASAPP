import { Controller, Get, Post, Query, Param, Body, Req, UseGuards } from '@nestjs/common';
import { AsistenciaService } from './asistencia.service';
import { MarcarAsistenciaDto } from './dto/asistencia.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('asistencia')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMINISTRADOR', 'INSTRUCTOR')
export class AsistenciaController {
  constructor(private service: AsistenciaService) {}

  @Get('sesion')
  obtenerSesion(@Query('horarioId') horarioId: string, @Query('fecha') fecha: string) {
    return this.service.obtenerSesion(horarioId, fecha);
  }

  @Post('marcar')
  marcar(@Body() dto: MarcarAsistenciaDto) {
    return this.service.marcar(dto);
  }

  // Admin, instructor y tutor (el tutor solo ve a sus propios alumnos; se valida en el service)
  @Get('resumen/:alumnoId')
  @Roles('ADMINISTRADOR', 'INSTRUCTOR', 'TUTOR')
  resumen(@Param('alumnoId') alumnoId: string, @Query('meses') meses: string, @Req() req: any) {
    return this.service.resumen(alumnoId, req.user, meses);
  }

  @Get('historial/:horarioId')
  findHistorial(@Param('horarioId') horarioId: string) {
    return this.service.findHistorialPorHorario(horarioId);
  }
}
