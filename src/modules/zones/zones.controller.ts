import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common'; // Importar Query
import { ZonesService } from './zones.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { UpdateLayoutDto } from './dto/update-layout.dto';
import { InstantiateZoneDto } from './dto/instantiate-zone.dto';

@Controller('zones')
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Post()
  create(@Body() createZoneDto: CreateZoneDto) {
    return this.zonesService.create(createZoneDto);
  }

  @Post('instantiate-blueprint')
  instantiate(@Body() dto: InstantiateZoneDto) {
    return this.zonesService.instantiateBlueprint(dto);
  }

  // --- MODIFICADO: SOPORTE PARA QUERY PARAM ---
  @Get()
  findAll(@Query('branchId') branchId?: string) {
    return this.zonesService.findAll(branchId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.zonesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateZoneDto: UpdateZoneDto) {
    return this.zonesService.update(id, updateZoneDto);
  }
  
  @Patch(':id/lock')
  lock(@Param('id') id: string) {
    return this.zonesService.setMaintenanceStatus(id, true);
  }

  @Patch(':id/unlock')
  unlock(@Param('id') id: string) {
    return this.zonesService.setMaintenanceStatus(id, false);
  }

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