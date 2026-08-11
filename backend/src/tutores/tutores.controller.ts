import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { TutoresService } from './tutores.service';
import { CreateTutorDto, UpdateTutorDto, GenerarAccesoDto } from './dto/tutor.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('tutores')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TutoresController {
  constructor(private service: TutoresService) {}

  @Get()
  @Roles('ADMINISTRADOR', 'INSTRUCTOR')
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles('ADMINISTRADOR', 'INSTRUCTOR')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('ADMINISTRADOR', 'INSTRUCTOR')
  create(@Body() dto: CreateTutorDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @Roles('ADMINISTRADOR', 'INSTRUCTOR')
  update(@Param('id') id: string, @Body() dto: UpdateTutorDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/generar-acceso')
  @Roles('ADMINISTRADOR')
  generarAcceso(@Param('id') id: string, @Body() dto: GenerarAccesoDto) {
    return this.service.generarAcceso(id, dto);
  }

  @Delete(':id')
  @Roles('ADMINISTRADOR')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
