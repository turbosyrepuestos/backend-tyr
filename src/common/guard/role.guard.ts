import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { UserRole } from './roles.enum';
import { ROLES_KEY } from '../decorators/roleGuard.decorator';

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const validRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Corrección 1: Verificación inicial de roles permitidos
    if (!validRoles) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    // Corrección 2: Verificar que el usuario está autenticado
    if (!user)
      throw new BadRequestException('User not found or not authenticated');

    // Corrección 3: Verificar si el rol del usuario está en la lista de roles permitidos
    if (validRoles.includes(user.role)) return true;

    // Corrección 4: Lanzar una excepción más descriptiva si el usuario no tiene el rol adecuado
    throw new ForbiddenException(
      `User requires one of the following roles: ${validRoles.join(', ')}`,
    );
  }
}
