import { IsString, IsDateString, IsNumber, IsOptional, IsArray } from 'class-validator';

export class CreatePeriodoDto {
  @IsString() mesAnio: string;
  @IsDateString() fechaLimite: string;
  @IsNumber() montoDefault: number;
}

export class UpdatePeriodoDto {
  @IsOptional() @IsString() estado?: string; // ABIERTO | CERRADO | CANCELADO
}

export class AgregarCandidatosPagoDto {
  @IsArray() alumnoIds: string[];
}

export class ActualizarPagoDto {
  @IsOptional() @IsString() estadoPago?: string; // PENDIENTE | PAGADO | VENCIDO | EXONERADO
  @IsOptional() @IsString() metodoPago?: string;
  @IsOptional() @IsNumber() montoAPagar?: number;
}
