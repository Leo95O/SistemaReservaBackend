import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Zone } from './entities/zone.entity';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

@Injectable()
export class ZonesService {
  constructor(
    @InjectRepository(Zone)
    private readonly zoneRepository: Repository<Zone>,
  ) {}

  create(createZoneDto: CreateZoneDto) {
    const zone = this.zoneRepository.create(createZoneDto);
    return this.zoneRepository.save(zone);
  }

  // AQUÍ ESTÁ LA MAGIA DEL "FULL MAP"
  findAll() {
    return this.zoneRepository.find({
      relations: ['tables'], // <-- Esto trae las mesas automáticamente
      order: {
        name: 'ASC', // Ordenar zonas alfabéticamente
      },
    });
  }

  async findOne(id: string) { // Cambié id: number a string (uuid)
    const zone = await this.zoneRepository.findOne({
      where: { id },
      relations: ['tables'], // <-- Importante para pintar el mapa individual
    });
    
    if (!zone) throw new NotFoundException(`Zona con ID ${id} no encontrada`);
    return zone;
  }

  async update(id: string, updateZoneDto: UpdateZoneDto) {
    const zone = await this.zoneRepository.preload({
      id: id,
      ...updateZoneDto,
    });
    if (!zone) throw new NotFoundException(`Zona con ID ${id} no encontrada`);
    return this.zoneRepository.save(zone);
  }

  async remove(id: string) {
    const zone = await this.findOne(id);
    return this.zoneRepository.remove(zone);
  }
}