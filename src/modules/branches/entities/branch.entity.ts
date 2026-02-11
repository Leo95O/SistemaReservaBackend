import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('branches')
export class Branch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  name: string;

  @Column('text', { nullable: true })
  address: string;

  @Column('text', { nullable: true })
  phone: string;

  // --- CONFIGURACIÓN DE HORARIOS ---
  
  // Guardamos el horario como un objeto JSON simple
  // Ej: { "mon": { "open": "08:00", "close": "22:00", "isOpen": true }, ... }
  @Column({ type: 'jsonb', nullable: true })
  schedule: Record<string, any>;

  // Duración por defecto de las reservas en esta sede (minutos)
  @Column({ type: 'int', default: 90 })
  defaultReservationDuration: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}