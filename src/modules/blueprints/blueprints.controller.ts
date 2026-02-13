import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { BlueprintsService } from './blueprints.service';
import { CreateBlueprintDto } from './dto/create-blueprint.dto';
import { UpdateBlueprintDto } from './dto/update-blueprint.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { Role } from '@modules/auth/enums/role.enum';

@Controller('blueprints')
@UseGuards(JwtAuthGuard, RolesGuard) // Seguridad Base: Token válido + Roles
export class BlueprintsController {
  constructor(private readonly blueprintsService: BlueprintsService) {}

  @Post()
  @Roles(Role.ADMIN) // Solo ADMIN crea
  create(@Body() createBlueprintDto: CreateBlueprintDto) {
    return this.blueprintsService.create(createBlueprintDto);
  }

  @Get()
  @Roles(Role.ADMIN) // 🔒 AHORA PROTEGIDO: Solo ADMIN ve la lista
  findAll() {
    return this.blueprintsService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN) // 🔒 AHORA PROTEGIDO: Solo ADMIN ve el detalle
  findOne(@Param('id') id: string) {
    return this.blueprintsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN) // Solo ADMIN edita
  update(@Param('id') id: string, @Body() updateBlueprintDto: UpdateBlueprintDto) {
    return this.blueprintsService.update(id, updateBlueprintDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN) // Solo ADMIN borra
  remove(@Param('id') id: string) {
    return this.blueprintsService.remove(id);
  }
}