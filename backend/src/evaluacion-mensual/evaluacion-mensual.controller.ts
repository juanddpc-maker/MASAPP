import { Controller, Get, Put, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { EvaluacionMensualService } from './evaluacion-mensual.service';
import { GuardarEvaluacionDto } from './dto/evaluacion-mensual.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('evaluacion-mensual')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EvaluacionMensualController {
  constructor(private service: EvaluacionMensualService) {}

  @Get('clase')
  @Roles('ADMINISTRADOR', 'INSTRUCTOR')
  clase(@Query('periodoId') periodoId: string, @Query('horarioId') horarioId: string) {
    return this.service.clase(periodoId, horarioId);
  }

  @Get('formulario')
  @Roles('ADMINISTRADOR', 'INSTRUCTOR')
  formulario(@Query('periodoId') periodoId: string, @Query('alumnoId') alumnoId: string) {
    return this.service.formulario(periodoId, alumnoId);
  }

  @Put()
  @Roles('ADMINISTRADOR', 'INSTRUCTOR')
  guardar(@Body() dto: GuardarEvaluacionDto, @Req() req: any) {
    return this.service.guardar(dto, req.user.userId);
  }

  @Get('alumno/:alumnoId')
  @Roles('ADMINISTRADOR', 'INSTRUCTOR')
  progreso(@Param('alumnoId') alumnoId: string) {
    return this.service.progreso(alumnoId);
  }
}
