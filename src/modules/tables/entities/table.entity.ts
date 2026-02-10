import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Zone } from '../../zones/entities/zone.entity';

@Entity('restaurant_tables')
export class TableEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  code: string; // Ej: T-01

  @Column('float')
  x: number;

  @Column('float')
  y: number;

  @Column('float', { default: 0 })
  rotation: number;

  @Column('int')
  capacity: number;

  @Column({ default: true })
  isActive: boolean;

  // Relación: Muchas Mesas pertenecen a una Zona
  @ManyToOne(() => Zone, (zone) => zone.tables, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'zone_id' })
  zone: Zone;
}