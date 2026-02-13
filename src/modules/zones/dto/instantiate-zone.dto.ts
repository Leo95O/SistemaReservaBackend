import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class InstantiateZoneDto {
  @IsUUID()
  @IsNotEmpty()
  blueprintId: string;

  @IsUUID()
  @IsNotEmpty()
  branchId: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}