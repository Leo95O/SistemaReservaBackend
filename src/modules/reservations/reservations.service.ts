import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { TableEntity } from '@modules/tables/entities/table.entity';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    
    @InjectRepository(TableEntity)
    private readonly tableRepository: Repository<TableEntity>,
  ) {}

  async create(createReservationDto: CreateReservationDto): Promise<Reservation> {
    const { tableId, ...reservationData } = createReservationDto;

    // 1. Validar que la mesa existe
    const table = await this.tableRepository.findOneBy({ id: tableId });
    if (!table) {
      throw new NotFoundException(`La mesa con ID ${tableId} no existe`);
    }

    // 2. TODO: Aquí iría la validación de solapamiento de horarios (lo haremos más adelante)
    
    // 3. Crear la reserva
    const reservation = this.reservationRepository.create({
      ...reservationData,
      table: table, // Asignamos la relación
      status: ReservationStatus.PENDING, // Por defecto entra como Pendiente
    });

    return this.reservationRepository.save(reservation);
  }

  findAll() {
    return this.reservationRepository.find({
      relations: ['table'], // Traer también los datos de la mesa
      order: { reservationTime: 'ASC' }
    });
  }

  async findOne(id: string) {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: ['table'],
    });
    if (!reservation) throw new NotFoundException('Reserva no encontrada');
    return reservation;
  }

  async cancel(id: string) {
    const reservation = await this.findOne(id);
    reservation.status = ReservationStatus.CANCELED;
    return this.reservationRepository.save(reservation);
  }
}