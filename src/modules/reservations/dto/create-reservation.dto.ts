import { IsString, IsNotEmpty, IsOptional, IsEmail, IsInt, Min, IsDateString, IsArray, ArrayMinSize, IsUUID } from 'class-validator';

export class CreateReservationDto {
  @IsString()
  @IsOptional()
  customerName: string;

  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @IsInt()
  @Min(30, { message: 'La duración mínima es de 30 minutos' })
  @IsOptional()
  duration?: number;

  @IsInt()
  @Min(1)
  pax: number;

  @IsString()
  @IsOptional()
  notes?: string;

  // CAMBIO: Aceptamos múltiples mesas
  @IsArray()
  @ArrayMinSize(1, { message: 'Debes seleccionar al menos una mesa' })
  @IsUUID('4', { each: true, message: 'ID de mesa inválido' })
  tableIds: string[];
}