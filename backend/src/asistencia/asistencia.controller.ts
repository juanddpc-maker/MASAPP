import { Controller, Get, Post, Query, Param, Body, UseGuards } from '@nestjs/common';
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

  @Get('historial/:horarioId')
  findHistorial(@Param('horarioId') horarioId: string) {
    return this.service.findHistorialPorHorario(horarioId);
  }
}
