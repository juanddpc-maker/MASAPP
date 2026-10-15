import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { LogrosService } from './logros.service';
import { CreateLogroDto, UpdateLogroDto } from './dto/logro.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

// Los tutores ven los logros desde el detalle del alumno (GET /alumnos/:id), que ya valida acceso.
@Controller('logros')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LogrosController {
  constructor(private service: LogrosService) {}

  @Get()
  @Roles('ADMINISTRADOR', 'INSTRUCTOR')
  findByAlumno(@Query('alumnoId') alumnoId: string) {
    return this.service.findByAlumno(alumnoId);
  }

  @Post()
  @Roles('ADMINISTRADOR', 'INSTRUCTOR')
  create(@Body() dto: CreateLogroDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @Roles('ADMINISTRADOR', 'INSTRUCTOR')
  update(@Param('id') id: string, @Body() dto: UpdateLogroDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMINISTRADOR', 'INSTRUCTOR')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
