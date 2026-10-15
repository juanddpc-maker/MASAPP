import { Controller, Get, Post, Delete, Param, Body, Query, Req, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FotosService } from './fotos.service';
import { CreateFotoDto } from './dto/foto.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('fotos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FotosController {
  constructor(private service: FotosService) {}

  // Tutores pueden ver las fotos de sus propios alumnos (se valida en el service)
  @Get()
  findByAlumno(@Query('alumnoId') alumnoId: string, @Req() req: any) {
    return this.service.findByAlumno(alumnoId, req.user);
  }

  @Post()
  @Roles('ADMINISTRADOR', 'INSTRUCTOR')
  @UseInterceptors(FileInterceptor('foto', { limits: { fileSize: 3 * 1024 * 1024 } }))
  create(@Body() dto: CreateFotoDto, @UploadedFile() file: any) {
    return this.service.create(dto, file);
  }

  @Delete(':id')
  @Roles('ADMINISTRADOR', 'INSTRUCTOR')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
