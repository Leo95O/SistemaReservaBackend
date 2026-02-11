import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { TableEntity } from '../../tables/entities/table.entity';

@Entity('zones')
export class Zone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  // NUEVO: Dimensiones reales de la zona (en metros)
  // Esto define el "Lienzo" máximo. Ej: Terraza de 10x20m.
  @Column({ type: 'float', default: 10 })
  width: number; 

  @Column({ type: 'float', default: 10 })
  height: number;

  // NUEVO: Imagen de fondo o referencia (opcional)
  @Column({ nullable: true })
  backgroundImageUrl: string;

  @ManyToOne(() => Branch, (branch) => branch.zones)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @OneToMany(() => TableEntity, (table) => table.zone)
  tables: TableEntity[];
}