import { Module } from '@nestjs/common';
import { ComportamientoService } from './comportamiento.service';
import { ComportamientoController } from './comportamiento.controller';

@Module({
  controllers: [ComportamientoController],
  providers: [ComportamientoService],
})
export class ComportamientoModule {}
