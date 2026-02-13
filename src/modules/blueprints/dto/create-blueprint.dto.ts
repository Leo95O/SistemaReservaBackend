import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber, Min, IsUrl } from 'class-validator';

export class CreateBlueprintDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  walls?: any[]; // Podrías crear una clase/interface específica para validar la estructura interna si deseas ser estricto

  @IsArray()
  @IsOptional()
  furnitureLayout?: any[];

  @IsString()
  @IsOptional() // Se manda la URL que devuelve el FilesModule
  previewImageUrl?: string;

  @IsNumber()
  @Min(1)
  width: number;

  @IsNumber()
  @Min(1)
  height: number;
}