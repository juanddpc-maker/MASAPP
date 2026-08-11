import { IsString, IsDateString, IsOptional, IsArray, ArrayMinSize, IsIn } from 'class-validator';

export class CreateAlumnoDto {
  @IsString() nombreCompleto: string;
  @IsDateString() fechaNacimiento: string;
  @IsOptional() @IsDateString() fechaInscripcion?: string; // si no se manda, se usa hoy
  @IsOptional() @IsIn(['MASCULINO', 'FEMENINO']) genero?: string;
  @IsOptional() @IsString() tallaCinta?: string;
  @IsOptional() @IsString() tallaUniforme?: string;
  @IsOptional() @IsString() condicionesMedicas?: string;
  @IsArray() @ArrayMinSize(1) horarioIds: string[]; // uno o más, ej. horario extra que se cobra aparte
  @IsOptional() @IsString() horarioPrincipalId?: string; // determina la disciplina base para la cinta actual
  @IsOptional() @IsString() cintaActualId?: string; // si no se manda, se asigna la cinta más baja de la disciplina principal

  @IsArray() @ArrayMinSize(1) tutorIds: string[];
  @IsOptional() @IsString() tutorPrincipalId?: string;
}
