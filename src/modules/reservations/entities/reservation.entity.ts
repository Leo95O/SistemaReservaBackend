import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, ManyToOne, JoinColumn } from 'typeorm';
import { TableEntity } from '@modules/tables/entities/table.entity';
import { User } from '@modules/users/entities/user.entity';

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

  // --- RELACIONES ---
  
  // 1. Relación con Mesas (N:M)
  @ManyToMany(() => TableEntity)
  @JoinTable({ name: 'reservation_tables' })
  tables: TableEntity[];

  // 2. Relación con Usuario (Puede ser null si es invitado o creado por admin)
  @ManyToOne(() => User, (user) => user.reservations, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}