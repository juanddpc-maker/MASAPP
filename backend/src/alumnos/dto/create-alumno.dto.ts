import { IsString, IsDateString, IsOptional, IsArray, ArrayMinSize, IsIn, ValidateIf, Matches } from 'class-validator';

export class CreateAlumnoDto {
  @IsString() nombreCompleto: string;
  @IsDateString() fechaNacimiento: string;
  @IsOptional() @IsDateString() fechaInscripcion?: string; // si no se manda, se usa hoy
  @IsOptional() @IsIn(['MASCULINO', 'FEMENINO']) genero?: string;
  @IsOptional() @IsString() tallaCinta?: string;
  @IsOptional() @IsString() tallaUniforme?: string;
  @IsOptional() @IsString() condicionesMedicas?: string;
  @ValidateIf((o) => !!o.curp) @Matches(/^[A-Z]{4}\d{6}[HMX][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d$/i, { message: 'CURP inválida (18 caracteres)' }) curp?: string;
  @IsOptional() @IsString() pais?: string;
  @IsArray() @ArrayMinSize(1) horarioIds: string[]; // uno o más, ej. horario extra que se cobra aparte
  @IsOptional() @IsString() horarioPrincipalId?: string; // determina la disciplina base para la cinta actual
  @IsOptional() @IsString() cintaActualId?: string; // si no se manda, se asigna la cinta más baja de la disciplina principal

  @IsArray() @ArrayMinSize(1) tutorIds: string[];
  @IsOptional() @IsString() tutorPrincipalId?: string;
}
