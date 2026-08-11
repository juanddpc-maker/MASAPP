import { IsString, IsArray, ValidateNested, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class ItemVentaDto {
  @IsString() varianteId: string;
  @IsNumber() cantidad: number;
}

export class CreateVentaDto {
  @IsString() alumnoId: string;
  @IsOptional() @IsString() metodoPago?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => ItemVentaDto) items: ItemVentaDto[];
}
