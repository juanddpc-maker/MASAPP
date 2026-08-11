import { IsString, IsDateString, IsOptional, IsArray, IsBoolean, IsIn } from 'class-validator';

export class CreateEventoDto {
  @IsString() nombre: string;
  @IsDateString() fechaExamen: string;
  @IsString() disciplinaId: string;
}

export class UpdateEventoDto {
  @IsOptional() @IsIn(['PLANEACION', 'EN_PROGRESO', 'COMPLETADO', 'CANCELADO']) estado?: string;
}

export class AgregarCandidatosDto {
  @IsArray() alumnoIds: string[]; // se puede mandar "todos los activos" ya resueltos desde el frontend
}

export class ActualizarCandidatoDto {
  @IsOptional() @IsString() cintaObjetivo?: string;
  @IsOptional() @IsString() tallaConfirmada?: string;
  @IsOptional() @IsBoolean() tutorConfirmo?: boolean;
  @IsOptional() @IsBoolean() presentaExamen?: boolean;
  @IsOptional() @IsString() resultado?: string; // PENDIENTE | APROBADO | NO_APROBADO | NO_SE_PRESENTO
  @IsOptional() @IsBoolean() pagoExamen?: boolean;
  @IsOptional() @IsString() notas?: string;
}
