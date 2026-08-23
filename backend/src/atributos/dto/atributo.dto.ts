import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateAtributoDto {
  @IsString() nombre: string;
  @IsOptional() @IsInt() orden?: number;
}
export class UpdateAtributoDto {
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsInt() orden?: number;
}
