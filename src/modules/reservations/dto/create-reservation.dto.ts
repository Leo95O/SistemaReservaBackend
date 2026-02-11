import { IsString, IsNotEmpty, IsOptional, IsEmail, IsInt, Min, IsDateString, IsUUID } from 'class-validator';

export class CreateReservationDto {
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsDateString() // Valida formato ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)
  @IsNotEmpty()
  startTime: string;

  @IsInt()
  @Min(30, { message: 'La duración mínima es de 30 minutos' })
  @IsOptional()
  duration?: number; // Si no lo envían, el backend pondrá 90 min

  @IsInt()
  @Min(1)
  pax: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsUUID()
  @IsNotEmpty()
  tableId: string;
}