import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { AlumnosService } from './alumnos.service';
import { CreateAlumnoDto } from './dto/create-alumno.dto';
import { UpdateAlumnoDto, UpdateTutoresAlumnoDto, UpdateHorariosAlumnoDto } from './dto/update-alumno.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('alumnos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AlumnosController {
  constructor(private alumnosService: AlumnosService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.alumnosService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.alumnosService.findOne(id, req.user);
  }

  @Post()
  @Roles('ADMINISTRADOR', 'INSTRUCTOR')
  create(@Body() dto: CreateAlumnoDto) {
    return this.alumnosService.create(dto);
  }

  @Put(':id')
  @Roles('ADMINISTRADOR', 'INSTRUCTOR')
  update(@Param('id') id: string, @Body() dto: UpdateAlumnoDto) {
    return this.alumnosService.update(id, dto);
  }

  @Put(':id/tutores')
  @Roles('ADMINISTRADOR', 'INSTRUCTOR')
  updateTutores(@Param('id') id: string, @Body() dto: UpdateTutoresAlumnoDto) {
    return this.alumnosService.updateTutores(id, dto);
  }

  @Put(':id/horarios')
  @Roles('ADMINISTRADOR', 'INSTRUCTOR')
  updateHorarios(@Param('id') id: string, @Body() dto: UpdateHorariosAlumnoDto) {
    return this.alumnosService.updateHorarios(id, dto);
  }

  @Delete(':id')
  @Roles('ADMINISTRADOR')
  remove(@Param('id') id: string) {
    return this.alumnosService.remove(id);
  }
}
