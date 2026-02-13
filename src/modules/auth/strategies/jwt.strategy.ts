import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service'; // Inyectamos UsersService

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private usersService: UsersService, // Inyectar servicio
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'SUPER_SECRET_KEY_DEV',
    });
  }

  async validate(payload: any) {
    // OPCIÓN PRO: Consultar DB para tener los roles frescos y el perfil completo
    // Esto asegura que si le quitas el admin a alguien, el token viejo no sirva para acciones críticas.
    const user = await this.usersService.findOne(payload.sub);
    
    if (!user) {
        throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    // Retornamos la entidad completa (con roles)
    // Esto inyecta el User Entity en req.user
    return user; 
  }
}