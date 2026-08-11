import { IsString, IsOptional, IsEmail, IsBoolean } from 'class-validator';

export class CreateTutorDto {
  @IsString() nombre: string;
  @IsString() telefono: string;
  @IsOptional() @IsEmail() correo?: string; // correo de contacto, ya NO genera acceso automático
  @IsString() relacion: string;
}

export class UpdateTutorDto {
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsString() telefono?: string;
  @IsOptional() @IsEmail() correo?: string;
  @IsOptional() @IsString() relacion?: string;
  @IsOptional() @IsBoolean() activo?: boolean;
}

export class GenerarAccesoDto {
  @IsEmail() correo: string; // correo de LOGIN, puede ser distinto al de contacto
}
