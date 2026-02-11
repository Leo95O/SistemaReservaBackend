import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

// ... imports

  async create(createUserDto: CreateUserDto) {
    try {
      const user = this.userRepository.create(createUserDto);
      return await this.userRepository.save(user); 
    } catch (error) {
      // SOLUCIÓN PROFESIONAL:
      // Hacemos un "Cast" (conversión) para decirle que el error tiene estructura de objeto
      if ((error as { code: string }).code === '23505') {
        throw new ConflictException('El email ya está registrado');
      }
      // Si no es el error que buscamos, lo relanzamos para que Nest lo maneje
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

  // Método especial para el Login (necesitamos buscar por email)
  async findByEmail(email: string) {
    return this.userRepository.findOne({ 
      where: { email },
      // Necesitamos seleccionar el password explícitamente para compararlo en el login,
      // porque @Exclude() lo oculta por defecto.
      select: ['id', 'email', 'password', 'role', 'fullName', 'isActive'] 
    });
  }
  // En UsersService:

async update(id: string, updateUserDto: any) {
  // Lógica pendiente
  return `This action updates a #${id} user`;
}

async remove(id: string) {
  // Lógica pendiente
  return `This action removes a #${id} user`;
}
}