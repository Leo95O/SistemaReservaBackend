import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Zone } from '../../zones/entities/zone.entity';


export enum TableShape {
  RECT = 'rect',
  CIRCLE = 'circle',
  CUSTOM = 'custom',
}

@Entity('tables')
export class TableEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  // --- GEOMETRÍA ---
  @Column({ type: 'float', default: 0 })
  x: number;

  @Column({ type: 'float', default: 0 })
  y: number;

  @Column({ type: 'float', default: 1.0 })
  width: number;

  @Column({ type: 'float', default: 1.0 })
  height: number;

  @Column({ type: 'float', default: 0 })
  rotation: number;

  @Column({ default: 'rect' })
  shape: string;

  @Column({ type: 'int', default: 4 })
  seats: number;

  // --- ESTADO ADMINISTRATIVO ---
  // Reemplaza al 'isReserved'. Define si la mesa existe físicamente o está en el taller.
  @Column({ default: true })
  isActive: boolean; 

  @ManyToOne(() => Zone, (zone) => zone.tables, { onDelete: 'CASCADE' }) // Importante: CASCADE para limpiar si borras zona
  @JoinColumn({ name: 'zone_id' })
  zone: Zone;
}