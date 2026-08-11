import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { HistorialService } from './historial.service';
import { CreateHistorialDto, UpdateHistorialDto } from './dto/historial.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('historial-cintas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMINISTRADOR')
export class HistorialController {
  constructor(private service: HistorialService) {}

  @Get()
  findByAlumno(@Query('alumnoId') alumnoId: string) {
    return this.service.findByAlumno(alumnoId);
  }

  @Post()
  create(@Body() dto: CreateHistorialDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateHistorialDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Delete('alumno/:alumnoId')
  removeAllByAlumno(@Param('alumnoId') alumnoId: string) {
    return this.service.removeAllByAlumno(alumnoId);
  }
}
