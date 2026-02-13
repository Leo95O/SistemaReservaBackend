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

  // --- 1. HISTORIAL DEL CLIENTE (Optimizado) ---
  // Endpoint: GET /reservations/my-bookings
  async findMyReservations(user: User) {
    return this.reservationRepository.find({
      where: { user: { id: user.id } }, // Filtro seguro por token
      relations: [
        'tables', 
        'tables.zone', 
        'tables.zone.branch'
      ], // Traemos toda la jerarquía para mostrar info completa
      order: { startTime: 'DESC' }, // Las más recientes primero
    });
  }

  // --- 2. DASHBOARD OPERATIVO (Admin) ---
  // Endpoint: GET /reservations/dashboard
  async getDailyDashboard(dateString: string, branchId?: string) {
    // Definir rango del día completo (00:00:00 - 23:59:59)
    const startOfDay = new Date(dateString);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateString);
    endOfDay.setHours(23, 59, 59, 999);

    // QueryBuilder para control total y performance
    const query = this.reservationRepository.createQueryBuilder('reservation')
      // Relaciones necesarias para la operación
      .leftJoinAndSelect('reservation.tables', 'table')
      .leftJoinAndSelect('table.zone', 'zone')
      .leftJoinAndSelect('zone.branch', 'branch')
      
      // JOIN SELECTIVO DE USUARIO (Seguridad)
      // Solo traemos datos públicos, NUNCA el password o roles
      .leftJoin('reservation.user', 'user')
      .addSelect(['user.id', 'user.fullName', 'user.email'])
      
      // Filtro de Fecha
      .where('reservation.startTime BETWEEN :start AND :end', { start: startOfDay, end: endOfDay })
      
      // Orden cronológico
      .orderBy('reservation.startTime', 'ASC');

    // Filtro opcional por Sede (si el admin quiere ver solo una sucursal)
    if (branchId) {
      query.andWhere('branch.id = :branchId', { branchId });
    }

    return query.getMany();
  }

  // --- MÉTODOS CORE DE NEGOCIO ---

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

  async create(createReservationDto: CreateReservationDto, currentUser?: User): Promise<Reservation> {
    const { tableIds, startTime: startTimeStr, duration = 90, ...data } = createReservationDto;
    const startTime = new Date(startTimeStr);

    let finalCustomerName = data.customerName;
    let finalCustomerPhone = data.customerPhone;
    let finalUser = null;

    // Lógica Híbrida: Admin (Manual) vs Cliente (App)
    if (currentUser) {
        const isAdmin = currentUser.roles.includes(Role.ADMIN);
        
        if (isAdmin) {
            if (!finalCustomerName) {
                throw new BadRequestException('Como Administrador, debes ingresar el nombre del cliente manualmente.');
            }
        } else {
            finalCustomerName = currentUser.fullName;
            finalUser = currentUser;
        }
    } else {
        // Guest
        if (!finalCustomerName) {
             throw new BadRequestException('El nombre del cliente es obligatorio.');
        }
    }

    const tables = await this.tableRepository.find({
      where: { id: In(tableIds) },
      relations: ['zone', 'zone.branch'], 
    });

    if (tables.length !== tableIds.length) {
      throw new BadRequestException('Alguna de las mesas seleccionadas no existe');
    }

    // Validaciones de Negocio
    const firstZoneId = tables[0].zone?.id;
    const allSameZone = tables.every(t => t.zone?.id === firstZoneId);
    if (!allSameZone) throw new BadRequestException('No se pueden unir mesas de diferentes zonas.');

    const zone = tables[0].zone;
    if (zone && zone.isUnderMaintenance) {
      throw new ServiceUnavailableException(`La zona "${zone.name}" está en Mantenimiento.`);
    }

    for (const table of tables) {
      if (!table.isActive) throw new BadRequestException(`La mesa "${table.name}" no está activa`);

      if (table.zone && table.zone.branch) {
        this.validateBranchSchedule(table.zone.branch, startTime, duration);
      }

      const isAvailable = await this.checkTableAvailability(table.id, startTime, duration);
      if (!isAvailable) {
        throw new ConflictException(`La mesa "${table.name}" ya está reservada en ese horario`);
      }
    }

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