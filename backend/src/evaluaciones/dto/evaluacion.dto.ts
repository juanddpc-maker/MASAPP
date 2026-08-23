import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';

export class CreateEvaluacionDto {
  @IsString() alumnoId: string;
  @IsString() atributoId: string;
  @IsInt() @Min(1) @Max(10) valor: number;
  @IsOptional() @IsString() nota?: string;
}
