import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { EscuelaService } from './escuela.service';
import { UpdateEscuelaDto } from './dto/escuela.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('escuela')
export class EscuelaController {
  constructor(private service: EscuelaService) {}

  // Pública dentro de la app (cualquier usuario logueado la necesita para ver el sidebar),
  // pero solo el admin la puede editar.
  @Get()
  @UseGuards(JwtAuthGuard)
  obtener() {
    return this.service.obtener();
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR')
  actualizar(@Body() dto: UpdateEscuelaDto) {
    return this.service.actualizar(dto);
  }
}
