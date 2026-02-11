import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ZonesService } from './zones.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { UpdateLayoutDto } from './dto/update-layout.dto'; // Importar el nuevo DTO

@Controller('zones')
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Post()
  create(@Body() createZoneDto: CreateZoneDto) {
    return this.zonesService.create(createZoneDto);
  }

  @Get()
  findAll() {
    return this.zonesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.zonesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateZoneDto: UpdateZoneDto) {
    return this.zonesService.update(id, updateZoneDto);
  }
  
  // --- NUEVO ENDPOINT: Guardar Diseño del Mapa ---
  @Patch(':id/layout')
  updateLayout(
    @Param('id') id: string, 
    @Body() updateLayoutDto: UpdateLayoutDto
  ) {
    return this.zonesService.updateLayout(id, updateLayoutDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.zonesService.remove(id);
  }
}