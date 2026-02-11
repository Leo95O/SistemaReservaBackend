import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { TableEntity } from '../../tables/entities/table.entity';
import { ManyToOne, JoinColumn } from 'typeorm';
import { Branch } from '@modules/branches/entities/branch.entity';

@Entity('zones')
export class Zone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  // DIMENSIONES FÍSICAS (en Metros)
  // Usamos 'float' en Postgres para precisión decimal (ej: 10.5 metros)
  @Column({ type: 'float', default: 10.0 })
  width: number;

  @Column({ type: 'float', default: 10.0 })
  height: number;

  // Plano de fondo (opcional) para calcar el mapa
  @Column({ type: 'text', nullable: true })
  backgroundImageUrl: string;

  @OneToMany(() => TableEntity, (table) => table.zone)
  tables: TableEntity[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Branch, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ nullable: true })
  branchId: string;
}