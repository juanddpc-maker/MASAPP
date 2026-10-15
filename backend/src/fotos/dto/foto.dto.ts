import { IsString, IsOptional, IsDateString } from 'class-validator';

// El archivo llega como multipart; estos son los campos de texto que lo acompañan.
export class CreateFotoDto {
  @IsString() alumnoId: string;
  @IsOptional() @IsDateString() fecha?: string;
  @IsOptional() @IsString() nota?: string;
}
