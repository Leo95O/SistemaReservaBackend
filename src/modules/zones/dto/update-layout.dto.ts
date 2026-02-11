import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTableDto } from '../../tables/dto/create-table.dto';
import { UpdateTableDto } from '../../tables/dto/update-table.dto';

// Clase auxiliar para identificar qué mesa actualizar
class UpdateTableWithIdDto extends UpdateTableDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;
}

export class UpdateLayoutDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTableDto)
  @IsOptional()
  tablesToCreate?: CreateTableDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateTableWithIdDto)
  @IsOptional()
  tablesToUpdate?: UpdateTableWithIdDto[];

  @IsArray()
  @IsUUID('4', { each: true }) // Valida que sea un array de UUIDs
  @IsOptional()
  tablesToDelete?: string[];
}