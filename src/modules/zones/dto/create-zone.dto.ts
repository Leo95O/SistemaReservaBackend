import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsUrl } from 'class-validator';

export class CreateZoneDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(1, { message: 'El ancho mínimo debe ser 1 metro' })
  @IsOptional() // Es opcional porque la Entity tiene default 10.0
  width?: number;

  @IsNumber()
  @Min(1, { message: 'El largo mínimo debe ser 1 metro' })
  @IsOptional()
  height?: number;

  @IsString()
  @IsUrl({}, { message: 'Debe ser una URL válida de imagen' })
  @IsOptional()
  backgroundImageUrl?: string;
}