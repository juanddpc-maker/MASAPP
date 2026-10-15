import { IsString, IsOptional, IsDateString, MinLength } from 'class-validator';

export class CreateLogroDto {
  @IsString() alumnoId: string;
  @IsString() @MinLength(2) titulo: string;
  @IsDateString() fecha: string;
  @IsOptional() @IsString() descripcion?: string;
}

export class UpdateLogroDto {
  @IsOptional() @IsString() @MinLength(2) titulo?: string;
  @IsOptional() @IsDateString() fecha?: string;
  @IsOptional() @IsString() descripcion?: string;
}
