import { IsString, IsNotEmpty, IsDateString, IsInt, Min, IsUUID, IsEmail, IsOptional } from 'class-validator';

export class CreateReservationDto {
  @IsString()
  @IsNotEmpty()
  customerName !: string;

  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsDateString() // Valida que envíen una fecha ISO 8601 válida
  reservationTime !: string;

  @IsInt()
  @Min(1)
  pax !: number;

  @IsUUID() // Valida que sea un ID real de mesa
  @IsNotEmpty()
  tableId !: string;
}