import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TableEntity } from '../../tables/entities/table.entity';

export enum ReservationStatus {
  PENDING = 'PENDING',       // Solicitada (falta confirmar)
  CONFIRMED = 'CONFIRMED',   // Confirmada por el local (Bloquea mesa)
  SEATED = 'SEATED',         // Clientes comiendo (Mesa en Rojo)
  COMPLETED = 'COMPLETED',   // Pagaron y se fueron (Libera mesa)
  CANCELED = 'CANCELED',     // Cancelada por cliente/local
  NO_SHOW = 'NO_SHOW',       // No se presentaron
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
  startTime: Date; // Reemplaza a reservationTime para ser más explícito

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
  notes: string; // Notas de alergias o preferencias

  // --- RELACIONES ---
  
  @ManyToOne(() => TableEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'table_id' })
  table: TableEntity;

  @Column({ nullable: true }) 
  tableId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 