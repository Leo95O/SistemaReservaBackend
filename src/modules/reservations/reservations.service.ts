import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThan, Not, In } from 'typeorm';
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

  // --- ALGORITMO CORE: Verificar Disponibilidad ---
  async checkTableAvailability(tableId: string, startTime: Date, durationMinutes: number): Promise<boolean> {
    // 1. Calcular hora de fin solicitada
    const requestedEnd = new Date(startTime.getTime() + durationMinutes * 60000);

    // 2. Buscar conflictos en base de datos
    // Buscamos reservas que NO estén canceladas ni terminadas
    // Y que se solapen temporalmente
    const conflictingReservation = await this.reservationRepository.createQueryBuilder('reservation')
      .where('reservation.tableId = :tableId', { tableId })
      .andWhere('reservation.status IN (:...activeStatuses)', { 
        activeStatuses: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED, ReservationStatus.SEATED] 
      })
      // Lógica de Solapamiento (Overlap): (StartA < EndB) AND (EndA > StartB)
      // En Postgres necesitamos sumar la duración al startTime para obtener el EndTime de la reserva existente
      .andWhere(`
        (reservation.startTime < :requestedEnd) AND 
        (reservation.startTime + (reservation.duration * interval '1 minute') > :requestedStart)
      `, { 
        requestedStart: startTime, 
        requestedEnd: requestedEnd 
      })
      .getOne();

    return !conflictingReservation; // Si NO hay conflicto, retorna true
  }

  async create(createReservationDto: CreateReservationDto): Promise<Reservation> {
    const { tableId, startTime: startTimeStr, duration = 90, ...data } = createReservationDto;
    const startTime = new Date(startTimeStr);

    // 1. Validar que la mesa existe
    const table = await this.tableRepository.findOneBy({ id: tableId });
    if (!table) throw new NotFoundException(`Mesa ${tableId} no encontrada`);

    // 2. Validar capacidad (Pax)
    if (data.pax > table.seats) {
       // Opcional: Permitir overbooking ligero o lanzar error
       throw new BadRequestException(`La mesa solo tiene capacidad para ${table.seats} personas`);
    }

    // 3. VALIDACIÓN CRÍTICA: Disponibilidad Temporal
    const isAvailable = await this.checkTableAvailability(tableId, startTime, duration);
    if (!isAvailable) {
      throw new ConflictException('La mesa ya está reservada en ese horario (o se solapa con otra reserva)');
    }

    // 4. Crear la reserva
    const reservation = this.reservationRepository.create({
      ...data,
      tableId,
      startTime,
      duration,
      status: ReservationStatus.CONFIRMED, // Asumimos confirmada si pasa validaciones (o PENDING según tu flujo)
    });

    return this.reservationRepository.save(reservation);
  }

  findAll() {
    return this.reservationRepository.find({
      relations: ['table'],
      order: { startTime: 'ASC' }
    });
  }

  // Método para el Frontend: Ver reservas de un día específico
  async findByDate(dateStr: string) {
    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0,0,0,0);
    
    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23,59,59,999);

    return this.reservationRepository.find({
      where: {
        startTime: Between(startOfDay, endOfDay)
      },
      relations: ['table'],
      order: { startTime: 'ASC' }
    });
  }
}