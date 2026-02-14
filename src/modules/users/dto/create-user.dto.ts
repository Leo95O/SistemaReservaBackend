import { IsString, IsEmail, IsNotEmpty, MinLength, IsOptional, IsEnum, IsArray } from 'class-validator';
import { Role } from '../../auth/enums/role.enum';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  // Opcional: El servicio suele forzar el rol (CLIENT o ADMIN) según el método llamado.
  // Pero lo dejamos aquí correctamente tipado para evitar errores de TypeScript.
  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true }) // Valida que cada elemento del array sea un Rol válido
  roles?: Role[];
}