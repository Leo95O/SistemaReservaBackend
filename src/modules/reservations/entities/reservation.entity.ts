import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TableEntity } from '../../tables/entities/table.entity';

export enum ReservationStatus {
  PENDING = 'PENDING',       // Bloqueo temporal (Naranja)
  CONFIRMED = 'CONFIRMED',   // Pagada/Confirmada (Rojo)
  CANCELED = 'CANCELED',     // Cancelada (Verde de nuevo)
  COMPLETED = 'COMPLETED',   // Ya comieron y se fueron
}

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id !: string;

  @Column('text')
  customerName !: string;

  @Column('text', { nullable: true })
  customerEmail !: string;

  @Column('text', { nullable: true })
  customerPhone !: string;

  @Column('timestamp')
  reservationTime !: Date; // Fecha y hora de la reserva

  @Column('int')
  pax !: number; // Cantidad de personas

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status !: ReservationStatus;

  @CreateDateColumn()
  createdAt !: Date;

  // RELACIONES
  // Muchas reservas pueden ser para una mesa (en diferentes horarios)
  @ManyToOne(() => TableEntity, (table) => table.reservations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'table_id' })
  table !: TableEntity;

  // Columna auxiliar para tener el ID a la mano sin cargar toda la relación
  @Column({ nullable: true }) 
  tableId !: string;
}