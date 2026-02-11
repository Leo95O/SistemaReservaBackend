import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Zone } from '../../zones/entities/zone.entity';

@Entity('tables')
export class TableEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // Ej: "Mesa 1", "Barra 2"

  // NUEVO: Posición X e Y (relativa a la zona, en metros)
  @Column({ type: 'float', default: 0 })
  x: number;

  @Column({ type: 'float', default: 0 })
  y: number;

  // NUEVO: Dimensiones físicas reales (en metros)
  @Column({ type: 'float', default: 1.0 }) // Ancho
  width: number;

  @Column({ type: 'float', default: 1.0 }) // Largo/Alto
  height: number;

  // NUEVO: Rotación (en grados, 0-360)
  @Column({ type: 'float', default: 0 })
  rotation: number;

  // NUEVO: Forma de la mesa (para dibujarla bien)
  // 'rect' | 'circle' | 'custom'
  @Column({ default: 'rect' })
  shape: string;

  // NUEVO: Capacidad (sillas)
  @Column({ type: 'int', default: 4 })
  seats: number;

  @Column({ default: false })
  isReserved: boolean;

  @ManyToOne(() => Zone, (zone) => zone.tables)
  @JoinColumn({ name: 'zone_id' })
  zone: Zone;
}