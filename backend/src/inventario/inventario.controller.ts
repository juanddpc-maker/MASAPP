import { Controller, Get, Post, Put, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { InventarioService } from './inventario.service';
import { CreateProductoDto, UpdateProductoDto, CreateVarianteDto, MovimientoDto } from './dto/inventario.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('inventario')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMINISTRADOR')
export class InventarioController {
  constructor(private service: InventarioService) {}

  @Get('productos')
  findAllProductos() {
    return this.service.findAllProductos();
  }

  @Get('productos/:id')
  findOneProducto(@Param('id') id: string) {
    return this.service.findOneProducto(id);
  }

  @Post('productos')
  createProducto(@Body() dto: CreateProductoDto) {
    return this.service.createProducto(dto);
  }

  @Put('productos/:id')
  updateProducto(@Param('id') id: string, @Body() dto: UpdateProductoDto) {
    return this.service.updateProducto(id, dto);
  }

  @Post('productos/:id/variantes')
  agregarVariante(@Param('id') id: string, @Body() dto: CreateVarianteDto) {
    return this.service.agregarVariante(id, dto);
  }

  @Post('variantes/:id/movimientos')
  registrarMovimiento(@Param('id') id: string, @Body() dto: MovimientoDto, @Req() req: any) {
    return this.service.registrarMovimiento(id, dto, req.user.userId);
  }

  @Get('variantes/:id/movimientos')
  findMovimientos(@Param('id') id: string) {
    return this.service.findMovimientos(id);
  }

  @Delete('productos/:id')
  removeProducto(@Param('id') id: string) {
    return this.service.removeProducto(id);
  }
}
