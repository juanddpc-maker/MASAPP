import { Controller, Get, UseGuards } from '@nestjs/common';
import { LogsService } from './logs.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMINISTRADOR')
export class LogsController {
  constructor(private service: LogsService) {}

  @Get('logins')
  findLoginLogs() {
    return this.service.findLoginLogs();
  }

  @Get('uso-modulos')
  usoPorModulo() {
    return this.service.usoPorModulo();
  }
}
