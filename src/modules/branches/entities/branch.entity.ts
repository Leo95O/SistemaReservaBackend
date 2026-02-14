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

  // --- NUEVO CAMPO ---
  @Column('text', { nullable: true })
  imageUrl: string;

  // Guardamos el horario como un objeto JSON simple
  @Column({ type: 'jsonb', nullable: true })
  schedule: Record<string, any>;

  @Column({ type: 'int', default: 90 })
  defaultReservationDuration: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}