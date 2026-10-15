import { IsString, IsOptional, IsDateString, IsIn, IsInt, Min, Max, IsArray, ArrayMinSize, ValidateNested, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePeriodoDto {
  @IsString() @MinLength(2) nombre: string;
  @IsDateString() fechaInicio: string;
  @IsDateString() fechaFin: string;
}

export class UpdatePeriodoDto {
  @IsOptional() @IsString() @MinLength(2) nombre?: string;
  @IsOptional() @IsDateString() fechaInicio?: string;
  @IsOptional() @IsDateString() fechaFin?: string;
  @IsOptional() @IsIn(['ABIERTO', 'CERRADO']) estado?: string;
}

export class ValorAtributoDto {
  @IsString() atributoId: string;
  @IsInt() @Min(1) @Max(10) valor: number;
}

export class GuardarEvaluacionDto {
  @IsString() periodoId: string;
  @IsString() alumnoId: string;
  @IsOptional() @IsString() notas?: string;
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => ValorAtributoDto)
  valores: ValorAtributoDto[];
}
