import { Injectable, ConflictException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { ConfigService } from '@nestjs/config';
import { Role } from '../auth/enums/role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  // --- SEED INICIAL (BOOTSTRAP) ---
  async onModuleInit() {
    const count = await this.userRepository.count();
    if (count === 0) {
      console.log('🌱 Base de datos vacía. Creando Super Admin...');
      const adminEmail = this.configService.get<string>('SUPER_ADMIN_EMAIL') || 'admin@admin.com';
      const adminPass = this.configService.get<string>('SUPER_ADMIN_PASS') || 'admin123';
      
      // La encriptación ocurrirá automáticamente por el Hook de la entidad, 
      // pero para el seed manual a veces es mejor hacerlo explícito o confiar en el hook.
      // Aquí dejaremos que el Hook @BeforeInsert de la entidad haga el trabajo sucio.
      
      const admin = this.userRepository.create({
        email: adminEmail,
        password: adminPass, // El hook lo encriptará
        fullName: 'Super Admin System',
        roles: [Role.ADMIN],
        isActive: true
      });
      
      await this.userRepository.save(admin);
      console.log('✅ Super Admin creado exitosamente.');
    }
  }

  // --- CREAR CLIENTE (Registro Público) ---
  async create(createUserDto: CreateUserDto) {
    try {
      const user = this.userRepository.create({
        ...createUserDto,
        roles: [Role.CLIENT], // Rol por defecto
      });
      return await this.userRepository.save(user); 
    } catch (error) {
      if ((error as { code: string }).code === '23505') {
        throw new ConflictException('El email ya está registrado');
      }
      throw error;
    }
  }

  // --- CREAR ADMIN (Gestión Interna) ---
  async createAdmin(createUserDto: CreateUserDto) {
    try {
      const user = this.userRepository.create({
        ...createUserDto,
        roles: [Role.ADMIN],
      });
      return await this.userRepository.save(user);
    } catch (error) {
      if ((error as { code: string }).code === '23505') {
        throw new ConflictException('El email ya está registrado');
      }
      throw error;
    }
  }

  findAll() {
    return this.userRepository.find();
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException(`Usuario no encontrado`);
    return user;
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({ 
      where: { email },
      // Seleccionamos password y roles explícitamente para el login
      select: ['id', 'email', 'password', 'roles', 'fullName', 'isActive'] 
    });
  }

  async update(id: string, updateUserDto: any) {
    // Implementación básica sugerida
    const user = await this.findOne(id);
    this.userRepository.merge(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    return this.userRepository.remove(user);
  }
}