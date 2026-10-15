import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AtributosService } from './atributos.service';
import { CreateAtributoDto, UpdateAtributoDto, AsignarAlumnosDto } from './dto/atributo.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('atributos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AtributosController {
  constructor(private service: AtributosService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @Roles('ADMINISTRADOR')
  create(@Body() dto: CreateAtributoDto) {
    return this.service.create(dto);
  }

  @Put(':id/alumnos')
  @Roles('ADMINISTRADOR')
  asignarAlumnos(@Param('id') id: string, @Body() dto: AsignarAlumnosDto) {
    return this.service.asignarAlumnos(id, dto.alumnoIds);
  }

  @Put(':id')
  @Roles('ADMINISTRADOR')
  update(@Param('id') id: string, @Body() dto: UpdateAtributoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMINISTRADOR')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
