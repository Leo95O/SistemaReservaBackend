import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { Role } from '../../auth/enums/role.enum'; // Asegúrate de crear este archivo
import { Reservation } from '../../reservations/entities/reservation.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  fullName: string;

  // @Exclude evita que el password salga en los JSON de respuesta
  @Exclude()
  @Column()
  password: string;

  // --- NUEVO: SISTEMA DE ROLES (RBAC) ---
  @Column({ 
    type: 'enum', 
    enum: Role, 
    array: true, // Array para soportar múltiples roles
    default: [Role.CLIENT] 
  })
  roles: Role[];

  @Column({ default: true })
  isActive: boolean;

  // --- RELACIÓN: HISTORIAL DE RESERVAS ---
  @OneToMany(() => Reservation, (reservation) => reservation.user)
  reservations: Reservation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // --- HOOKS DE ENCRIPTACIÓN ---
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2b$')) {
       const salt = await bcrypt.genSalt();
       this.password = await bcrypt.hash(this.password, salt);
    }
  }
}