import { IsString, IsOptional, IsEmail, IsIn, MinLength } from 'class-validator';

export class CreateUsuarioDto {
  @IsString() nombre: string;
  @IsEmail() correo: string;
  @MinLength(6) password: string;
  @IsIn(['ADMINISTRADOR', 'INSTRUCTOR', 'TUTOR']) rol: string;
  @IsOptional() @IsString() tutorId?: string;
}

export class UpdateUsuarioDto {
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsEmail() correo?: string;
  @IsOptional() @IsIn(['ADMINISTRADOR', 'INSTRUCTOR', 'TUTOR']) rol?: string;
  @IsOptional() activo?: boolean;
}
