import { IsString, IsNumber, IsOptional, IsInt } from 'class-validator';

export class CreateProductoDto {
  @IsString() nombre: string;
  @IsString() categoriaId: string;
  @IsOptional() @IsString() disciplina?: string;
  @IsNumber() precioBase: number;
}

export class UpdateProductoDto {
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsString() categoriaId?: string;
  @IsOptional() @IsString() disciplina?: string;
  @IsOptional() @IsNumber() precioBase?: number;
  @IsOptional() activo?: boolean;
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
