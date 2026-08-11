import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsArray, ArrayMinSize, IsOptional, IsString, IsIn } from 'class-validator';
import { CreateAlumnoDto } from './create-alumno.dto';

export class UpdateAlumnoDto extends PartialType(OmitType(CreateAlumnoDto, ['tutorIds', 'tutorPrincipalId', 'horarioIds', 'horarioPrincipalId'] as const)) {
  @IsOptional() @IsIn(['ACTIVO', 'INACTIVO', 'SUSPENDIDO']) estado?: string;
}

export class UpdateTutoresAlumnoDto {
  @IsArray() @ArrayMinSize(1) tutorIds: string[];
  @IsOptional() @IsString() tutorPrincipalId?: string;
}

export class UpdateHorariosAlumnoDto {
  @IsArray() @ArrayMinSize(1) horarioIds: string[];
  @IsOptional() @IsString() horarioPrincipalId?: string;
}
