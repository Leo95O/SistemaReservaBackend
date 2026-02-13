import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('blueprints')
export class Blueprint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  name: string;

  @Column('text', { nullable: true })
  description: string;

  // GEOMETRÍA PARAMÉTRICA (Muros, Ventanas, Puertas)
  // Guardamos la estructura exacta que envía el CAD del Frontend
  @Column({ type: 'jsonb', default: [] })
  walls: any[]; 

  // LAYOUT DE MOBILIARIO IDEAL
  // Definición abstracta de mesas: { type: 'rect', x: 10, y: 5, ... }
  @Column({ type: 'jsonb', default: [] })
  furnitureLayout: any[];

  // Render generado por el frontend (referencia al FilesModule)
  @Column('text', { nullable: true })
  previewImageUrl: string;

  @Column('float', { default: 10.0 })
  width: number;

  @Column('float', { default: 10.0 })
  height: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}