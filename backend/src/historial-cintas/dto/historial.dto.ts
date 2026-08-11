import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateHistorialDto {
  @IsString() alumnoId: string;
  @IsString() cintaId: string;
  @IsOptional() @IsDateString() fechaObtencion?: string;
  @IsOptional() @IsString() instructor?: string;
}

export class UpdateHistorialDto {
  @IsOptional() @IsString() cintaId?: string;
  @IsOptional() @IsDateString() fechaObtencion?: string;
  @IsOptional() @IsString() instructor?: string;
}
