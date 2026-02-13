import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { Role } from '@modules/auth/enums/role.enum';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // --- 1. REGISTRO PÚBLICO (Crea CLIENTES) ---
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // --- 2. GESTIÓN ADMIN (Crea ADMINS) - PROTEGIDO 🛡️ ---
  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard) // 1. Autenticado, 2. Rol correcto
  @Roles(Role.ADMIN) // ¡Solo un Admin puede entrar aquí!
  createAdmin(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createAdmin(createUserDto);
  }

  // --- 3. LISTAR TODOS (Solo Admins para no exponer data) ---
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  // --- 4. VER PERFIL (Protegido por Token) ---
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard) // Idealmente validar que el usuario se edite a sí mismo o sea Admin
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN) // Solo Admin borra usuarios
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}