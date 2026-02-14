import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsObject } from 'class-validator';

export class CreateBranchDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  // --- NUEVO CAMPO ---
  // Usamos IsString para permitir URLs completas o paths relativos
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsObject()
  @IsOptional()
  schedule?: Record<string, any>;

  @IsInt()
  @Min(30)
  @IsOptional()
  defaultReservationDuration?: number;
}