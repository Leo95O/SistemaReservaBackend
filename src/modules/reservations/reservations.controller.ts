import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { Role } from '@modules/auth/enums/role.enum';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard) // Puede reservar Admin (para otros) o Cliente (para sí mismo)
  create(@Body() createReservationDto: CreateReservationDto, @Req() req) {
    return this.reservationsService.create(createReservationDto, req.user);
  }

  // --- 1. VISTA CLIENTE: "Mis Reservas" ---
  @Get('my-bookings')
  @UseGuards(JwtAuthGuard) // Solo requiere Login
  findMyBookings(@Req() req) {
    // Obtenemos el usuario del Token JWT
    return this.reservationsService.findMyReservations(req.user);
  }

  // --- 2. VISTA ADMIN: Dashboard Operativo ---
  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard) // 1. Login, 2. Verificación de Rol
  @Roles(Role.ADMIN) // ¡CRÍTICO! Solo ADMIN entra aquí
  getDashboard(
    @Query('date') date: string, 
    @Query('branchId') branchId?: string
  ) {
    // Si no manda fecha, podrías devolver error o usar hoy por defecto.
    // Aquí asumimos que el Frontend siempre manda fecha.
    return this.reservationsService.getDailyDashboard(date, branchId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN) // Listado general protegido
  findAll() {
    return this.reservationsService.findAll();
  }

  @Get('by-date')
  // Mantenemos legacy o protegemos igual que dashboard
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findByDate(@Query('date') date: string) {
    return this.reservationsService.findByDate(date);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard) // Permitimos ver detalle (idealmente validar si es dueño o admin)
  findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  cancel(@Param('id') id: string) {
    return this.reservationsService.cancel(id);
  }
}