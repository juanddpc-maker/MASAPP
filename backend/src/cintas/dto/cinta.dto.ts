import { IsString, IsInt, IsOptional } from 'class-validator';

export class CreateCintaDto {
  @IsString() nombre: string;
  @IsInt() orden: number;
  @IsString() disciplinaId: string;
  @IsString() color1: string;
  @IsString() color2: string;
  @IsString() color3: string;
}

export class UpdateCintaDto {
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsInt() orden?: number;
  @IsOptional() @IsString() disciplinaId?: string;
  @IsOptional() @IsString() color1?: string;
  @IsOptional() @IsString() color2?: string;
  @IsOptional() @IsString() color3?: string;
}
