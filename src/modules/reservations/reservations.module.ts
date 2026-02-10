import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { Reservation } from './entities/reservation.entity';
import { TableEntity } from '../tables/entities/table.entity';

@Module({
  imports: [
    // Registramos AMBAS entidades porque el servicio usa ambas
    TypeOrmModule.forFeature([Reservation, TableEntity])
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService] // Por si otro módulo necesita crear reservas
})
export class ReservationsModule {}