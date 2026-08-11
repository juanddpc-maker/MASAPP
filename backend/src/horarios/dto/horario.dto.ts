import { IsString, IsOptional, IsArray, ArrayMinSize, IsIn, Matches, IsNumber } from 'class-validator';

const DIAS_VALIDOS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
const FORMATO_HORA = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:MM en 24h

export class CreateHorarioDto {
  @IsString() disciplinaId: string;
  @IsString() nombre: string;
  @IsArray() @ArrayMinSize(1) @IsIn(DIAS_VALIDOS, { each: true }) dias: string[];
  @Matches(FORMATO_HORA, { message: 'horaInicio debe tener formato HH:MM' }) horaInicio: string;
  @Matches(FORMATO_HORA, { message: 'horaFin debe tener formato HH:MM' }) horaFin: string;
  @IsOptional() @IsNumber() costoExtra?: number; // se cobra aparte cuando NO es el horario principal del alumno
}

export class UpdateHorarioDto {
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsArray() @ArrayMinSize(1) @IsIn(DIAS_VALIDOS, { each: true }) dias?: string[];
  @IsOptional() @Matches(FORMATO_HORA) horaInicio?: string;
  @IsOptional() @Matches(FORMATO_HORA) horaFin?: string;
  @IsOptional() @IsNumber() costoExtra?: number;
}
