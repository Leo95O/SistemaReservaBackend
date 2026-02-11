import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm'; // Importante: Between es necesario para findByDate
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
    // Si la sede no tiene horario configurado, permitimos la reserva (o puedes lanzar error)
    if (!branch || !branch.schedule) return; 

    // 1. Obtener día de la semana ('mon', 'tue', etc.)
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayKey = days[startTime.getDay()];

    const daySchedule = branch.schedule[dayKey];

    // 2. Verificar si abre ese día (isOpen: true)
    if (!daySchedule || !daySchedule.isOpen) {
      throw new BadRequestException(`El local está cerrado los ${dayKey}`);
    }

    // 3. Convertir horas a minutos del día (ej: "08:00" -> 480)
    const getMinutes = (timeStr: string) => {
      const [hours, mins] = timeStr.split(':').map(Number);
      return hours * 60 + mins;
    };

    const openTime = getMinutes(daySchedule.open);
    const closeTime = getMinutes(daySchedule.close);
    
    // Calculamos inicio y fin de la reserva en minutos desde las 00:00
    const reservationStart = startTime.getHours() * 60 + startTime.getMinutes();
    const reservationEnd = reservationStart + durationMinutes;

    // 4. Validar que la reserva esté COMPLETAMENTE dentro del horario
    if (reservationStart < openTime || reservationEnd > closeTime) {
      throw new BadRequestException(
        `La reserva (${startTime.getHours()}:${startTime.getMinutes()}) está fuera del horario de atención (${daySchedule.open} - ${daySchedule.close})`
      );
    }
  }

  // --- ALGORITMO CORE: Verificar Disponibilidad (Collision Detection) ---
  async checkTableAvailability(tableId: string, startTime: Date, durationMinutes: number): Promise<boolean> {
    const requestedEnd = new Date(startTime.getTime() + durationMinutes * 60000);
    
    const conflictingReservation = await this.reservationRepository.createQueryBuilder('reservation')
      .where('reservation.tableId = :tableId', { tableId })
      .andWhere('reservation.status IN (:...activeStatuses)', { 
        activeStatuses: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED, ReservationStatus.SEATED] 
      })
      // Lógica de Solapamiento: (StartA < EndB) AND (EndA > StartB)
      .andWhere(`
        (reservation.startTime < :requestedEnd) AND 
        (reservation.startTime + (reservation.duration * interval '1 minute') > :requestedStart)
      `, { requestedStart: startTime, requestedEnd: requestedEnd })
      .getOne();

    return !conflictingReservation; // Retorna true si NO hay conflicto
  }

  // --- CREAR RESERVA (Con todas las validaciones) ---
  async create(createReservationDto: CreateReservationDto): Promise<Reservation> {
    const { tableId, startTime: startTimeStr, duration = 90, ...data } = createReservationDto;
    const startTime = new Date(startTimeStr);

    // 1. Cargar Mesa + Zona + Sede (Branch)
    // Necesitamos 'zone.branch' para acceder al schedule
    const table = await this.tableRepository.findOne({
      where: { id: tableId },
      relations: ['zone', 'zone.branch'], 
    });

    if (!table) throw new NotFoundException(`Mesa ${tableId} no encontrada`);
    if (!table.isActive) throw new BadRequestException('Esta mesa no está disponible (Inactiva/Mantenimiento)');

    // 2. Validar Capacidad (Pax)
    if (data.pax > table.seats) {
       // Puedes comentar esto si permites "apretar" gente
       throw new BadRequestException(`La mesa solo tiene capacidad para ${table.seats} personas`);
    }

    // 3. VALIDACIÓN DE HORARIO DE SEDE
    if (table.zone && table.zone.branch) {
      this.validateBranchSchedule(table.zone.branch, startTime, duration);
    } else {
        // Log de advertencia para el desarrollador
        console.warn(`La mesa ${tableId} pertenece a una zona sin Sede o Horario configurado.`);
    }

    // 4. VALIDACIÓN DE COLISIÓN (Disponibilidad)
    const isAvailable = await this.checkTableAvailability(tableId, startTime, duration);
    if (!isAvailable) {
      throw new ConflictException('La mesa ya está reservada en ese horario (solapamiento)');
    }

    // 5. Guardar Reserva
    const reservation = this.reservationRepository.create({
      ...data,
      tableId,
      startTime,
      duration,
      status: ReservationStatus.CONFIRMED,
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