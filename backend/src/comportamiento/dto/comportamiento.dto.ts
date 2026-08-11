import { IsString, IsIn, IsOptional, IsBoolean } from 'class-validator';

export class CreateRegistroDto {
  @IsString() alumnoId: string;
  @IsIn(['POSITIVO', 'NEGATIVO', 'NEUTRO']) tipo: string;
  @IsString() categoria: string;
  @IsString() descripcion: string;
  @IsOptional() @IsBoolean() requiereSeguimiento?: boolean;
  @IsOptional() @IsBoolean() notificarTutor?: boolean; // si true, crea también una Conversacion
}
