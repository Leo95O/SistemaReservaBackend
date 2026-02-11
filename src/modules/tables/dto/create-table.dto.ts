import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, IsUUID, IsIn, Max } from 'class-validator';
import { TableShape } from '../entities/table.entity';

export class CreateTableDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsOptional()
  x?: number;

  @IsNumber()
  @IsOptional()
  y?: number;

  @IsNumber()
  @Min(0.5, { message: 'El ancho mínimo es 0.5 metros' })
  @IsOptional()
  width?: number;

  @IsNumber()
  @Min(0.5, { message: 'El largo mínimo es 0.5 metros' })
  @IsOptional()
  height?: number;

  @IsNumber()
  @Min(0)
  @Max(360)
  @IsOptional()
  rotation?: number;

  @IsString()
  @IsIn([TableShape.RECT, TableShape.CIRCLE, TableShape.CUSTOM])
  @IsOptional()
  shape?: TableShape;

  @IsNumber()
  @Min(1)
  @IsOptional()
  seats?: number;

  @IsUUID()
  @IsNotEmpty()
  zoneId: string;
}