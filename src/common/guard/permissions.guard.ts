import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { RoleService } from 'src/module/roles/services/role.service';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: {
    role: string;
  };
}

/**
 * Guard que valida permisos resolviendo los del rol del usuario desde BD.
 * No usa permisos del JWT: el payload solo lleva el nombre del rol (user.role).
 * Los módulos que usen este guard deben importar RolesModule.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly roleService: RoleService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const user = req.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Resolver permisos del rol desde BD (no desde el JWT)
    const userPermissions: string[] =
      await this.roleService.getPermissionsByRoleName(user.role);

    const hasAllPermissions = requiredPermissions.every((permission) =>
      this.checkPermission(userPermissions, permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        `No tienes los permisos necesarios. Requeridos: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }

  /**
   * Verifica si el usuario tiene un permiso específico
   * Soporta wildcards: 'recipes:*' o '*'
   */
  private checkPermission(
    userPermissions: string[],
    requiredPermission: string,
  ): boolean {
    // Si el usuario tiene el permiso '*', tiene todos los permisos
    if (userPermissions.includes('*')) {
      return true;
    }

    // Verificar permiso exacto
    if (userPermissions.includes(requiredPermission)) {
      return true;
    }

    // Verificar permisos con wildcard (ej: 'recipes:*' cubre 'recipes:create', 'recipes:read', etc.)
    const permissionParts = requiredPermission.split(':');
    if (permissionParts.length > 0) {
      const wildcardPermission = `${permissionParts[0]}:*`;
      if (userPermissions.includes(wildcardPermission)) {
        return true;
      }
    }

    return false;
  }
}
