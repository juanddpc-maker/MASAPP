import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { CintasService } from './cintas.service';
import { CreateCintaDto, UpdateCintaDto } from './dto/cinta.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('cintas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CintasController {
  constructor(private service: CintasService) {}

  @Get()
  findAll(@Query('disciplinaId') disciplinaId?: string) {
    return this.service.findAll(disciplinaId);
  }

  @Get('conteo-alumnos')
  conteoAlumnosPorCinta() {
    return this.service.conteoAlumnosPorCinta();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/alumnos')
  findAlumnosConEstaCinta(@Param('id') id: string) {
    return this.service.findAlumnosConEstaCinta(id);
  }

  @Post()
  @Roles('ADMINISTRADOR')
  create(@Body() dto: CreateCintaDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @Roles('ADMINISTRADOR')
  update(@Param('id') id: string, @Body() dto: UpdateCintaDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMINISTRADOR')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
