import { IsString, IsDateString, IsIn, IsOptional } from 'class-validator';

export class MarcarAsistenciaDto {
  @IsString() horarioId: string;
  @IsDateString() fecha: string; // día de la clase, ej. "2026-08-23"
  @IsString() alumnoId: string;
  @IsOptional() @IsIn(['PRESENTE', 'RETARDO']) estado?: string; // si no se manda, se "desmarca" (vuelve a ausente)
}
