import { IsString, IsOptional } from 'class-validator';

export class CreateCategoriaDto {
  @IsString() nombre: string;
}
export class UpdateCategoriaDto {
  @IsOptional() @IsString() nombre?: string;
}
