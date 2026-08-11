import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { EventosService } from './eventos.service';
import { CreateEventoDto, AgregarCandidatosDto, ActualizarCandidatoDto, UpdateEventoDto } from './dto/evento.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('eventos-cambio-cinta')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMINISTRADOR', 'INSTRUCTOR')
export class EventosController {
  constructor(private service: EventosService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateEventoDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @Roles('ADMINISTRADOR')
  update(@Param('id') id: string, @Body() dto: UpdateEventoDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/candidatos')
  agregarCandidatos(@Param('id') id: string, @Body() dto: AgregarCandidatosDto) {
    return this.service.agregarCandidatos(id, dto);
  }

  @Put('candidatos/:candidatoId')
  actualizarCandidato(@Param('candidatoId') candidatoId: string, @Body() dto: ActualizarCandidatoDto) {
    return this.service.actualizarCandidato(candidatoId, dto);
  }

  @Put('candidatos/:candidatoId/talla')
  actualizarTalla(@Param('candidatoId') candidatoId: string, @Body() body: { tallaConfirmada: string }) {
    return this.service.actualizarTalla(candidatoId, body.tallaConfirmada);
  }

  @Delete(':id')
  @Roles('ADMINISTRADOR')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
