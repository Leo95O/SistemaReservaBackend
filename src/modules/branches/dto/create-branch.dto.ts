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

  @IsObject()
  @IsOptional()
  schedule?: Record<string, any>;

  @IsInt()
  @Min(30)
  @IsOptional()
  defaultReservationDuration?: number;
}