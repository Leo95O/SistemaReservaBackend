import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TableEntity } from '@modules/tables/entities/table.entity';
import { Branch } from '@modules/branches/entities/branch.entity';
import { Blueprint } from '@modules/blueprints/entities/blueprint.entity'; // Importar Blueprint

@Entity('zones')
export class Zone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'float', default: 10.0 })
  width: number;

  @Column({ type: 'float', default: 10.0 })
  height: number;

  @Column({ type: 'text', nullable: true })
  backgroundImageUrl: string;

  // NUEVO: Geometría real de esta zona (copia del blueprint al instanciar)
  @Column({ type: 'jsonb', default: [] })
  walls: any[];

  // NUEVO: Bloqueo Operativo
  @Column({ default: false })
  isUnderMaintenance: boolean;

  // NUEVO: Trazabilidad (Opcional por si se borra el blueprint original)
  @ManyToOne(() => Blueprint, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'blueprint_id' })
  blueprint: Blueprint;

  @Column({ nullable: true })
  blueprintId: string;

  @OneToMany(() => TableEntity, (table) => table.zone)
  tables: TableEntity[];

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Branch, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ nullable: true })
  branchId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}