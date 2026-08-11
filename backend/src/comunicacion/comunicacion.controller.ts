import { Controller, Get, Post, Put, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ComunicacionService } from './comunicacion.service';
import { CreateConversacionDto, CreateMensajeDto, UpdateConversacionDto } from './dto/comunicacion.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('conversaciones')
@UseGuards(JwtAuthGuard)
export class ComunicacionController {
  constructor(private service: ComunicacionService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.user);
  }

  @Get('no-leidos')
  contarNoLeidos(@Req() req: any) {
    return this.service.contarNoLeidos(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.service.findOne(id, req.user);
  }

  @Post()
  create(@Body() dto: CreateConversacionDto, @Req() req: any) {
    return this.service.create(dto, req.user);
  }

  @Post(':id/mensajes')
  responder(@Param('id') id: string, @Body() dto: CreateMensajeDto, @Req() req: any) {
    return this.service.responder(id, dto, req.user.userId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateConversacionDto) {
    return this.service.update(id, dto);
  }
}
