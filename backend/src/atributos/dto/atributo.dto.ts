import { IsString, IsOptional, IsInt, IsIn, IsArray } from 'class-validator';

export class CreateAtributoDto {
  @IsString() nombre: string;
  @IsOptional() @IsInt() orden?: number;
  @IsOptional() @IsIn(['GENERAL', 'PERSONAL']) alcance?: string;
}
export class UpdateAtributoDto {
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsInt() orden?: number;
}
export class AsignarAlumnosDto {
  @IsArray() @IsString({ each: true }) alumnoIds: string[];
}
