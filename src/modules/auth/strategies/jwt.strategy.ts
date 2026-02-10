import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      // Extraer el token del Header "Authorization: Bearer <token>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Rechazar tokens vencidos
      // Leer el secreto desde variables de entorno (¡Seguridad!)
      secretOrKey: configService.get('JWT_SECRET') || 'SUPER_SECRET_KEY_DEV', 
    });
  }

  // Si el token es válido, NestJS ejecuta esto automáticamente
  async validate(payload: any) {
    // Lo que retornes aquí se inyectará en `req.user`
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}