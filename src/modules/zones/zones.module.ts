import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZonesService } from './zones.service';
import { ZonesController } from './zones.controller';
import { Zone } from './entities/zone.entity';
import { Blueprint } from '../blueprints/entities/blueprint.entity'; // <--- Importante

@Module({
  imports: [
    // Registramos Zone y Blueprint para que el Servicio pueda inyectar sus Repositorios
    TypeOrmModule.forFeature([Zone, Blueprint]), 
  ],
  controllers: [ZonesController],
  providers: [ZonesService],
  exports: [ZonesService], // Buena práctica exportarlo por si otro módulo lo necesita
})
export class ZonesModule {}