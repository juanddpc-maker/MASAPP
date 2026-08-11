import { IsString, IsOptional } from 'class-validator';

export class UpdateEscuelaDto {
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsString() logoUrl?: string;
}
