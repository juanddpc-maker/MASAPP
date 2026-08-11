import { IsString, IsOptional } from 'class-validator';

export class CreateDisciplinaDto {
  @IsString() nombre: string;
}
export class UpdateDisciplinaDto {
  @IsOptional() @IsString() nombre?: string;
}
