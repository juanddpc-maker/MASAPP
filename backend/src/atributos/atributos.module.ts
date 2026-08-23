import { Module } from '@nestjs/common';
import { AtributosService } from './atributos.service';
import { AtributosController } from './atributos.controller';

@Module({
  controllers: [AtributosController],
  providers: [AtributosService],
})
export class AtributosModule {}
