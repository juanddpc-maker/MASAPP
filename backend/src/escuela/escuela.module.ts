import { Module } from '@nestjs/common';
import { EscuelaService } from './escuela.service';
import { EscuelaController } from './escuela.controller';

@Module({
  controllers: [EscuelaController],
  providers: [EscuelaService],
})
export class EscuelaModule {}
