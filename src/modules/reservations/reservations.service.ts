import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm'; // Importamos In
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

  // --- HELPER: VALIDAR HORARIO DE LA SEDE ---
  private validateBranchSchedule(branch: any, startTime: Date, durationMinutes: number) {
    if (!branch || !branch.schedule) return; 

    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayKey = days[startTime.getDay()];
    const daySchedule = branch.schedule[dayKey];

    if (!daySchedule || !daySchedule.isOpen) {
      throw new BadRequestException(`El local está cerrado los ${dayKey}`);
    }

    const getMinutes = (timeStr: string) => {
      const [hours, mins] = timeStr.split(':').map(Number);
      return hours * 60 + mins;
    };

    const openTime = getMinutes(daySchedule.open);
    const closeTime = getMinutes(daySchedule.close);
    
    const reservationStart = startTime.getHours() * 60 + startTime.getMinutes();
    const reservationEnd = reservationStart + durationMinutes;

    if (reservationStart < openTime || reservationEnd > closeTime) {
      throw new BadRequestException(
        `La reserva (${startTime.getHours()}:${startTime.getMinutes()}) está fuera del horario de atención (${daySchedule.open} - ${daySchedule.close})`
      );
    }
  }

  // --- ALGORITMO CORE: Verificar Disponibilidad ---
  async checkTableAvailability(tableId: string, startTime: Date, durationMinutes: number): Promise<boolean> {
    const requestedEnd = new Date(startTime.getTime() + durationMinutes * 60000);
    
    // NOTA: Al cambiar a ManyToMany, la query cambia ligeramente.
    // Buscamos reservas que tengan ESA mesa en su lista de 'tables'
    const conflictingReservation = await this.reservationRepository.createQueryBuilder('reservation')
      .innerJoin('reservation.tables', 'table') // Unir con la relación tables
      .where('table.id = :tableId', { tableId })
      .andWhere('reservation.status IN (:...activeStatuses)', { 
        activeStatuses: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED, ReservationStatus.SEATED] 
      })
      .andWhere(`
        (reservation.startTime < :requestedEnd) AND 
        (reservation.startTime + (reservation.duration * interval '1 minute') > :requestedStart)
      `, { requestedStart: startTime, requestedEnd: requestedEnd })
      .getOne();

    return !conflictingReservation; 
  }

  // --- CREAR RESERVA (MULTI-MESA) ---
  async create(createReservationDto: CreateReservationDto): Promise<Reservation> {
    const { tableIds, startTime: startTimeStr, duration = 90, ...data } = createReservationDto;
    const startTime = new Date(startTimeStr);

    // 1. Cargar TODAS las mesas solicitadas
    const tables = await this.tableRepository.find({
      where: { id: In(tableIds) },
      relations: ['zone', 'zone.branch'], 
    });

    if (tables.length !== tableIds.length) {
      throw new BadRequestException('Alguna de las mesas seleccionadas no existe');
    }

    // 2. Validar cada mesa (Ciclo)
    for (const table of tables) {
      // A. Validar estado físico
      if (!table.isActive) {
        throw new BadRequestException(`La mesa "${table.name}" no está disponible (Inactiva)`);
      }

      // B. Validar Horario de Sede
      if (table.zone && table.zone.branch) {
        this.validateBranchSchedule(table.zone.branch, startTime, duration);
      }

      // C. Validar Colisión (Disponibilidad)
      const isAvailable = await this.checkTableAvailability(table.id, startTime, duration);
      if (!isAvailable) {
        throw new ConflictException(`La mesa "${table.name}" ya está reservada en ese horario`);
      }
    }

    // 3. Guardar Reserva con Relación Múltiple
    const reservation = this.reservationRepository.create({
      ...data,
      startTime,
      duration,
      status: ReservationStatus.CONFIRMED,
      tables: tables, // TypeORM guarda la relación en la tabla intermedia
    });

    return this.reservationRepository.save(reservation);
  }

  findAll() {
    return this.reservationRepository.find({
      relations: ['tables'], // Traer array de mesas
      order: { startTime: 'ASC' }
    });
  }

  async findByDate(dateStr: string) {
    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23,59,59,999);

    return this.reservationRepository.find({
      where: { startTime: Between(startOfDay, endOfDay) },
      relations: ['tables'],
      order: { startTime: 'ASC' }
    });
  }
}