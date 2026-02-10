import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { TableEntity } from '../../tables/entities/table.entity';

@Entity('zones') // Nombre de la tabla en Postgres
export class Zone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('float')
  width: number; // Ancho en metros

  @Column('float')
  height: number; // Alto en metros

  @Column({ nullable: true })
  backgroundImageUrl: string;

  // Relación: Una Zona tiene muchas Mesas
  @OneToMany(() => TableEntity, (table) => table.zone)
  tables: TableEntity[];
}