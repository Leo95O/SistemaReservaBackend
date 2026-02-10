import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '@modules/users/users.service'; // ¡Usando Alias!
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // 1. Validar usuario y contraseña
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    
    // Si el usuario existe y la contraseña coincide (usando bcrypt)
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user; // Quitamos el password del objeto
      return result;
    }
    return null;
  }

  // 2. Generar el Token (Login)
  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: user, // Opcional: devolver datos del usuario también
    };
  }
}