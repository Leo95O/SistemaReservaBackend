import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';

// Definimos roles simples para empezar
export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  fullName: string;

  // @Exclude hace que este campo NO se envíe en el JSON de respuesta
  // ¡Seguridad básica!
  @Column()
  @Exclude() 
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STAFF })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // --- HOOKS (Calidad Enterprise) ---
  // Antes de insertar o actualizar, encriptamos la contraseña automáticamente
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    // Solo encriptar si la contraseña ha cambiado y no está ya encriptada
    // (Bcrypt siempre genera strings largos, si es corto es texto plano)
    if (this.password && this.password.length < 60) {
      const salt = await bcrypt.genSalt();
      this.password = await bcrypt.hash(this.password, salt);
    }
  }
}