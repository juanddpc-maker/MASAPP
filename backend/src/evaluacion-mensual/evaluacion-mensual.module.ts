import { Module } from '@nestjs/common';
import { PeriodosService } from './periodos.service';
import { PeriodosController } from './periodos.controller';
import { EvaluacionMensualService } from './evaluacion-mensual.service';
import { EvaluacionMensualController } from './evaluacion-mensual.controller';

@Module({
  controllers: [PeriodosController, EvaluacionMensualController],
  providers: [PeriodosService, EvaluacionMensualService],
})
export class EvaluacionMensualModule {}
