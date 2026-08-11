import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateConversacionDto {
  @IsString() alumnoId: string;
  @IsOptional() @IsString() tutorId?: string; // no aplica si quien inicia es el propio tutor
  @IsIn(['COMPORTAMIENTO', 'PROGRESO', 'REUNION', 'PAGO', 'EXAMEN', 'AVISO_GENERAL', 'CONSULTA_TUTOR']) tipo: string;
  @IsString() asunto: string;
  @IsString() contenidoInicial: string; // el primer mensaje del hilo
}

export class CreateMensajeDto {
  @IsString() contenido: string;
}

export class UpdateConversacionDto {
  @IsOptional() @IsIn(['ABIERTA', 'CERRADA']) estado?: string;
}
