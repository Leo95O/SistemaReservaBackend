import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm'; // Solución: Importar OneToMany
import { Zone } from '@modules/zones/entities/zone.entity'; // Solución: Alias limpio
// Nota: Como Reservation es una relación circular, a veces requerimos forwardRef, 
// pero por ahora importaremos normal usando el alias.
import { Reservation } from '@modules/reservations/entities/reservation.entity'; // Solución: Importar Reservation

@Entity('restaurant_tables')
export class TableEntity {
  @PrimaryGeneratedColumn('uuid')
  id !: string;

  @Column()
  code !: string; 

  @Column('float')
  x !: number;

  @Column('float')
  y !: number;

  @Column('float', { default: 0 })
  rotation !: number;

  @Column('int')
  capacity !: number;

  @Column({ default: true })
  isActive !: boolean;

  // Relación con Zona
  @ManyToOne(() => Zone, (zone) => zone.tables, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'zone_id' })
  zone !: Zone;

  // Solución: Relación agregada correctamente sin texto basura
  @OneToMany(() => Reservation, (reservation) => reservation.table)
  reservations !: Reservation[];
}