import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { PagosService } from './pagos.service';
import { CreatePeriodoDto, AgregarCandidatosPagoDto, ActualizarPagoDto, UpdatePeriodoDto } from './dto/pago.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('pagos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PagosController {
  constructor(private service: PagosService) {}

  @Get('periodos')
  @Roles('ADMINISTRADOR')
  findAllPeriodos() {
    return this.service.findAllPeriodos();
  }

  @Get('periodos/:id')
  @Roles('ADMINISTRADOR')
  findOnePeriodo(@Param('id') id: string) {
    return this.service.findOnePeriodo(id);
  }

  @Post('periodos')
  @Roles('ADMINISTRADOR')
  createPeriodo(@Body() dto: CreatePeriodoDto) {
    return this.service.createPeriodo(dto);
  }

  @Put('periodos/:id')
  @Roles('ADMINISTRADOR')
  updateEstadoPeriodo(@Param('id') id: string, @Body() dto: UpdatePeriodoDto) {
    return this.service.updateEstadoPeriodo(id, dto.estado);
  }

  @Post('periodos/:id/candidatos')
  @Roles('ADMINISTRADOR')
  agregarCandidatos(@Param('id') id: string, @Body() dto: AgregarCandidatosPagoDto) {
    return this.service.agregarCandidatos(id, dto);
  }

  @Put('candidatos/:candidatoId')
  @Roles('ADMINISTRADOR')
  actualizarPago(@Param('candidatoId') candidatoId: string, @Body() dto: ActualizarPagoDto) {
    return this.service.actualizarPago(candidatoId, dto);
  }

  @Delete('periodos/:id')
  @Roles('ADMINISTRADOR')
  removePeriodo(@Param('id') id: string) {
    return this.service.removePeriodo(id);
  }
}
