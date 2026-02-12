import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { TableEntity } from '@modules/tables/entities/table.entity';

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SEATED = 'SEATED',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
  NO_SHOW = 'NO_SHOW',
}

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  customerName: string;

  @Column('text', { nullable: true })
  customerEmail: string;

  @Column('text', { nullable: true })
  customerPhone: string;

  // --- LÓGICA TEMPORAL ---
  
  @Column('timestamp')
  startTime: Date;

  @Column('int', { default: 90 }) 
  duration: number; // Duración estimada en minutos

  // --- CAPACIDAD ---

  @Column('int')
  pax: number;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @Column('text', { nullable: true })
  notes: string;

  // --- RELACIONES (MULTIPLE TABLES) ---
  
  // Cambio a ManyToMany para permitir agrupar mesas
  @ManyToMany(() => TableEntity)
  @JoinTable({ name: 'reservation_tables' }) // Tabla intermedia automática
  tables: TableEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}