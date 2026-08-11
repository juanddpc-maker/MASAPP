import { Controller, Get, Post, Put, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ComportamientoService } from './comportamiento.service';
import { CreateRegistroDto } from './dto/comportamiento.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('comportamiento')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMINISTRADOR', 'INSTRUCTOR')
export class ComportamientoController {
  constructor(private service: ComportamientoService) {}

  @Get()
  findAll(@Query('alumnoId') alumnoId?: string) {
    if (alumnoId) return this.service.findByAlumno(alumnoId);
    return this.service.findAll();
  }

  @Post()
  create(@Body() dto: CreateRegistroDto, @Req() req: any) {
    return this.service.create(dto, req.user.userId);
  }

  @Put(':id/resolver')
  resolverSeguimiento(@Param('id') id: string) {
    return this.service.resolverSeguimiento(id);
  }
}
