import { Injectable, NotFoundException, BadRequestException, ConflictException, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { TableEntity } from '@modules/tables/entities/table.entity';
import { User } from '@modules/users/entities/user.entity';
import { Role } from '@modules/auth/enums/role.enum';

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
    
    const conflictingReservation = await this.reservationRepository.createQueryBuilder('reservation')
      .innerJoin('reservation.tables', 'table') 
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

  // --- CREAR RESERVA (HÍBRIDA + MULTI-MESA) ---
  async create(createReservationDto: CreateReservationDto, currentUser?: User): Promise<Reservation> {
    const { tableIds, startTime: startTimeStr, duration = 90, ...data } = createReservationDto;
    const startTime = new Date(startTimeStr);

    // --- 1. LÓGICA DE USUARIO VS GUEST ---
    let finalCustomerName = data.customerName;
    let finalCustomerPhone = data.customerPhone;
    let finalUser = null;

    if (currentUser) {
        const isAdmin = currentUser.roles.includes(Role.ADMIN);
        
        if (isAdmin) {
            // Caso B: ADMIN creando reserva manual
            if (!finalCustomerName) {
                throw new BadRequestException('Como Administrador, debes ingresar el nombre del cliente manualmente.');
            }
            // finalUser se queda null (Reserva a nombre de un tercero)
        } else {
            // Caso A: CLIENT creando su propia reserva
            finalCustomerName = currentUser.fullName; // Autocompletar
            finalUser = currentUser; // Vincular cuenta
        }
    } else {
        // Caso C: Guest / Sin Login
        if (!finalCustomerName) {
             throw new BadRequestException('El nombre del cliente es obligatorio.');
        }
    }

    // --- 2. CARGAR Y VALIDAR MESAS ---
    const tables = await this.tableRepository.find({
      where: { id: In(tableIds) },
      relations: ['zone', 'zone.branch'], 
    });

    if (tables.length !== tableIds.length) {
      throw new BadRequestException('Alguna de las mesas seleccionadas no existe');
    }

    // Validar integridad de Zona
    const firstZoneId = tables[0].zone?.id;
    const allSameZone = tables.every(t => t.zone?.id === firstZoneId);
    if (!allSameZone) throw new BadRequestException('No se pueden unir mesas de diferentes zonas.');

    // Validar Mantenimiento
    const zone = tables[0].zone;
    if (zone && zone.isUnderMaintenance) {
      throw new ServiceUnavailableException(`La zona "${zone.name}" está en Mantenimiento.`);
    }

    // --- 3. VALIDAR DISPONIBILIDAD (Bucle) ---
    for (const table of tables) {
      if (!table.isActive) throw new BadRequestException(`La mesa "${table.name}" no está activa`);

      if (table.zone && table.zone.branch) {
        this.validateBranchSchedule(table.zone.branch, startTime, duration);
      } else {
         console.warn(`La mesa ${table.name} no tiene sede configurada.`);
      }

      const isAvailable = await this.checkTableAvailability(table.id, startTime, duration);
      if (!isAvailable) {
        throw new ConflictException(`La mesa "${table.name}" ya está reservada en ese horario`);
      }
    }

    // --- 4. GUARDAR RESERVA ---
    const reservation = this.reservationRepository.create({
      ...data,
      customerName: finalCustomerName,
      customerPhone: finalCustomerPhone,
      startTime,
      duration,
      status: ReservationStatus.CONFIRMED,
      tables: tables,
      user: finalUser,
    });

    return this.reservationRepository.save(reservation);
  }

  findAll() {
    return this.reservationRepository.find({
      relations: ['tables', 'user'], 
      order: { startTime: 'ASC' }
    });
  }

  async findOne(id: string) {
      const reservation = await this.reservationRepository.findOne({
          where: { id },
          relations: ['tables', 'user']
      });
      if (!reservation) throw new NotFoundException('Reserva no encontrada');
      return reservation;
  }

  async cancel(id: string) {
      const reservation = await this.findOne(id);
      reservation.status = ReservationStatus.CANCELED;
      return this.reservationRepository.save(reservation);
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