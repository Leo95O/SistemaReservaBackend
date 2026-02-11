import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Zone } from './entities/zone.entity';
import { TableEntity } from '@modules/tables/entities/table.entity';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { UpdateLayoutDto } from './dto/update-layout.dto';

@Injectable()
export class ZonesService {
  constructor(
    @InjectRepository(Zone)
    private readonly zoneRepository: Repository<Zone>,
    private readonly dataSource: DataSource,
  ) {}

  create(createZoneDto: CreateZoneDto) {
    const zone = this.zoneRepository.create(createZoneDto);
    return this.zoneRepository.save(zone);
  }

  findAll() {
    return this.zoneRepository.find({
      relations: ['tables'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const zone = await this.zoneRepository.findOne({
      where: { id },
      relations: ['tables'],
    });
    if (!zone) throw new NotFoundException(`Zona con ID ${id} no encontrada`);
    return zone;
  }

  async update(id: string, updateZoneDto: UpdateZoneDto) {
    const zone = await this.zoneRepository.preload({
      id,
      ...updateZoneDto,
    });
    if (!zone) throw new NotFoundException(`Zona con ID ${id} no encontrada`);
    return this.zoneRepository.save(zone);
  }

  async remove(id: string) {
    const zone = await this.findOne(id);
    return this.zoneRepository.remove(zone);
  }

  // --- FIX: Batch Layout Update (Corregido) ---
  async updateLayout(zoneId: string, dto: UpdateLayoutDto) {
    const zone = await this.findOne(zoneId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { tablesToCreate, tablesToUpdate, tablesToDelete } = dto;

      // A. ELIMINAR
      if (tablesToDelete && tablesToDelete.length > 0) {
        await queryRunner.manager.delete(TableEntity, tablesToDelete);
      }

      // B. ACTUALIZAR
      if (tablesToUpdate && tablesToUpdate.length > 0) {
        for (const tableData of tablesToUpdate) {
          const { id, ...updateData } = tableData;
          
          // FIX 1: Usar la relación 'zone' en lugar de 'zoneId' implícito
          await queryRunner.manager.update(
            TableEntity, 
            { id, zone: { id: zoneId } }, 
            updateData
          );
        }
      }

      // C. CREAR
      if (tablesToCreate && tablesToCreate.length > 0) {
        const newTables = tablesToCreate.map(t => {
          return queryRunner.manager.create(TableEntity, {
            ...t,
            zone: zone,
          });
        });
        await queryRunner.manager.save(newTables);
      }

      await queryRunner.commitTransaction();
      return this.findOne(zoneId);

    } catch (err) {
      await queryRunner.rollbackTransaction();
      // FIX 2: Cast de 'err' a Error o any para acceder a .message
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      throw new BadRequestException('Error al guardar el diseño: ' + errorMessage);
    } finally {
      await queryRunner.release();
    }
  }
}