import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blueprint } from './entities/blueprint.entity';
import { CreateBlueprintDto } from './dto/create-blueprint.dto';
import { UpdateBlueprintDto } from './dto/update-blueprint.dto';

@Injectable()
export class BlueprintsService {
  constructor(
    @InjectRepository(Blueprint)
    private readonly blueprintRepository: Repository<Blueprint>,
  ) {}

  create(createDto: CreateBlueprintDto) {
    const blueprint = this.blueprintRepository.create(createDto);
    return this.blueprintRepository.save(blueprint);
  }

  findAll() {
    return this.blueprintRepository.find();
  }

  async findOne(id: string) {
    const blueprint = await this.blueprintRepository.findOneBy({ id });
    if (!blueprint) throw new NotFoundException(`Blueprint ${id} not found`);
    return blueprint;
  }

  async update(id: string, updateDto: UpdateBlueprintDto) {
    const blueprint = await this.findOne(id);
    Object.assign(blueprint, updateDto);
    return this.blueprintRepository.save(blueprint);
  }

  async remove(id: string) {
    const blueprint = await this.findOne(id);
    return this.blueprintRepository.remove(blueprint);
  }
}