import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { PeriodosService } from './periodos.service';
import { CreatePeriodoDto, UpdatePeriodoDto } from './dto/evaluacion-mensual.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('periodos-evaluacion')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PeriodosController {
  constructor(private service: PeriodosService) {}

  @Get()
  @Roles('ADMINISTRADOR', 'INSTRUCTOR')
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @Roles('ADMINISTRADOR')
  create(@Body() dto: CreatePeriodoDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @Roles('ADMINISTRADOR')
  update(@Param('id') id: string, @Body() dto: UpdatePeriodoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMINISTRADOR')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
