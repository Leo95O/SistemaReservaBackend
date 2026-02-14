import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // <--- Importar TypeOrmModule
import { BlueprintsService } from './blueprints.service';
import { BlueprintsController } from './blueprints.controller';
import { Blueprint } from './entities/blueprint.entity'; // <--- Importar la Entidad

@Module({
  imports: [
    // Registramos la entidad para que el Repository esté disponible
    TypeOrmModule.forFeature([Blueprint]), 
  ],
  controllers: [BlueprintsController],
  providers: [BlueprintsService],
  exports: [BlueprintsService], // Exportamos por si ZonesModule lo necesita (que sí lo hace)
})
export class BlueprintsModule {}