import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si el endpoint no tiene decorador @Roles, es público (o solo requiere Auth básico)
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    // Validamos si el usuario existe (autenticado) y si tiene al menos uno de los roles requeridos
    if (!user || !user.roles) {
        throw new ForbiddenException('Usuario no identificado o sin roles');
    }

    const hasRole = requiredRoles.some((role) => user.roles.includes(role));
    if (!hasRole) {
        throw new ForbiddenException(`Se requiere rol: ${requiredRoles.join(' o ')}`);
    }

    return true;
  }
}