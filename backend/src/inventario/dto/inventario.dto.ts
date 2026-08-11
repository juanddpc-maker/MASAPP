import { IsString, IsNumber, IsOptional, IsInt } from 'class-validator';

export class CreateProductoDto {
  @IsString() nombre: string;
  @IsString() categoria: string;
  @IsOptional() @IsString() disciplina?: string;
  @IsNumber() precioBase: number;
}

export class CreateVarianteDto {
  @IsOptional() @IsString() talla?: string;
  @IsOptional() @IsString() color?: string;
  @IsString() sku: string;
  @IsNumber() precio: number;
  @IsInt() stockInicial: number;
}

export class MovimientoDto {
  @IsString() tipo: string; // ENTRADA | SALIDA | AJUSTE | VENTA | DEVOLUCION
  @IsInt() cantidad: number;
  @IsOptional() @IsString() nota?: string;
}
