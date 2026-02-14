import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, FindOptionsWhere } from 'typeorm'; // Importar FindOptionsWhere
import { Zone } from './entities/zone.entity';
import { TableEntity } from '@modules/tables/entities/table.entity';
import { Blueprint } from '@modules/blueprints/entities/blueprint.entity';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { UpdateLayoutDto } from './dto/update-layout.dto';
import { InstantiateZoneDto } from './dto/instantiate-zone.dto';

@Injectable()
export class ZonesService {
  constructor(
    @InjectRepository(Zone)
    private readonly zoneRepository: Repository<Zone>,
    
    @InjectRepository(Blueprint)
    private readonly blueprintRepository: Repository<Blueprint>,
    
    private readonly dataSource: DataSource,
  ) {}

  // --- CRUD ESTÁNDAR ---

  create(createZoneDto: CreateZoneDto) {
    const zone = this.zoneRepository.create(createZoneDto);
    return this.zoneRepository.save(zone);
  }

  // --- MODIFICADO: FILTRO POR SUCURSAL ---
  findAll(branchId?: string) {
    // Objeto de filtro dinámico
    const where: FindOptionsWhere<Zone> = {};
    
    if (branchId) {
      where.branchId = branchId; // Filtra si llega el parámetro
    }

    return this.zoneRepository.find({
      where, // Inyectamos el filtro (vacío o con ID)
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

  // --- 1. INSTANCIACIÓN (CLONACIÓN DE BLUEPRINT) ---
  async instantiateBlueprint(dto: InstantiateZoneDto) {
    const { blueprintId, branchId, name } = dto;

    const blueprint = await this.blueprintRepository.findOneBy({ id: blueprintId });
    if (!blueprint) throw new NotFoundException('Blueprint no encontrado');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newZone = queryRunner.manager.create(Zone, {
        name: name,
        width: blueprint.width,
        height: blueprint.height,
        walls: blueprint.walls,
        backgroundImageUrl: blueprint.previewImageUrl,
        branchId: branchId,
        blueprintId: blueprint.id,
        isUnderMaintenance: true, 
      });

      const savedZone = await queryRunner.manager.save(newZone);

      if (blueprint.furnitureLayout && blueprint.furnitureLayout.length > 0) {
        const realTables = blueprint.furnitureLayout.map((item: any, index: number) => {
          return queryRunner.manager.create(TableEntity, {
            name: `Mesa ${index + 1}`,
            x: item.x || 0,
            y: item.y || 0,
            width: item.width || 1,
            height: item.height || 1,
            rotation: item.rotation || 0,
            shape: item.shape || 'rect',
            seats: item.seats || 4,
            zone: savedZone,
          });
        });
        await queryRunner.manager.save(realTables);
      }

      await queryRunner.commitTransaction();
      return this.findOne(savedZone.id);

    } catch (err) {
      await queryRunner.rollbackTransaction();
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      throw new BadRequestException('Error al instanciar el plano: ' + errorMessage);
    } finally {
      await queryRunner.release();
    }
  }

  // --- 2. LOCKING MECHANISM ---
  async setMaintenanceStatus(id: string, status: boolean) {
    const zone = await this.zoneRepository.findOneBy({ id });
    if (!zone) throw new NotFoundException(`Zona con ID ${id} no encontrada`);
    
    zone.isUnderMaintenance = status;
    return this.zoneRepository.save(zone);
  }

  // --- 3. BATCH LAYOUT UPDATE ---
  async updateLayout(zoneId: string, dto: UpdateLayoutDto) {
    const zone = await this.findOne(zoneId);

    if (!zone.isUnderMaintenance) {
      throw new ConflictException(
        'La zona está OPERATIVA. Debes ponerla en Mantenimiento (Lock) antes de editar su estructura.'
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { tablesToCreate, tablesToUpdate, tablesToDelete } = dto;

      if (tablesToDelete && tablesToDelete.length > 0) {
        await queryRunner.manager.delete(TableEntity, tablesToDelete);
      }

      if (tablesToUpdate && tablesToUpdate.length > 0) {
        for (const tableData of tablesToUpdate) {
          const { id, ...updateData } = tableData;
          await queryRunner.manager.update(
            TableEntity, 
            { id, zone: { id: zoneId } }, 
            updateData
          );
        }
      }

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
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      throw new BadRequestException('Error al guardar el diseño: ' + errorMessage);
    } finally {
      await queryRunner.release();
    }
  }
}