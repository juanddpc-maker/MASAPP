import { Controller, Get, Post, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { EvaluacionesService } from './evaluaciones.service';
import { CreateEvaluacionDto } from './dto/evaluacion.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('evaluaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMINISTRADOR', 'INSTRUCTOR')
export class EvaluacionesController {
  constructor(private service: EvaluacionesService) {}

  @Get('actuales/:alumnoId')
  valoresActuales(@Param('alumnoId') alumnoId: string) {
    return this.service.valoresActuales(alumnoId);
  }

  @Get('historial/:alumnoId')
  findHistorial(@Param('alumnoId') alumnoId: string) {
    return this.service.findHistorial(alumnoId);
  }

  @Post()
  create(@Body() dto: CreateEvaluacionDto, @Req() req: any) {
    return this.service.create(dto, req.user.userId);
  }
}
