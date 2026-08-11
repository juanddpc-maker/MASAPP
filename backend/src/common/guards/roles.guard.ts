import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// Se usa junto con @Roles(...) y JwtAuthGuard.
// Revisa que el usuario autenticado tenga uno de los roles permitidos.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesPermitidos = this.reflector.get<string[]>('roles', context.getHandler());
    if (!rolesPermitidos) return true; // si no se especifican roles, cualquiera autenticado puede pasar

    const request = context.switchToHttp().getRequest();
    const usuario = request.user;

    if (!usuario || !rolesPermitidos.includes(usuario.rol)) {
      throw new ForbiddenException('No tienes permisos para esta acción');
    }
    return true;
  }
}
