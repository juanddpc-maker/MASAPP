import { Module } from '@nestjs/common';
import { ComunicacionService } from './comunicacion.service';
import { ComunicacionController } from './comunicacion.controller';

@Module({
  controllers: [ComunicacionController],
  providers: [ComunicacionService],
})
export class ComunicacionModule {}
