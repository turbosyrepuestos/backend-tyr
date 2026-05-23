import { applyDecorators, CanActivate, Type, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guard/jwt.guard';
import { UserRoleGuard } from '../guard/role.guard';
import { PermissionsGuard } from '../guard/permissions.guard';
import { Roles } from './roleGuard.decorator';
import { RequirePermissions } from './permissions.decorator';
import { UserRole } from '../guard/roles.enum';

/**
 * Decorador unificado para autenticación, autorización y permisos
 *
 * Soporta múltiples formas de uso:
 * - @Auth() - Solo autenticación JWT
 * - @Auth(UserRole.ADMIN) - Autenticación + Roles (compatibilidad)
 * - @Auth(UserRole.ADMIN, UserRole.USER) - Autenticación + Múltiples roles
 * - @Auth({ roles: [UserRole.ADMIN] }) - Autenticación + Roles (formato objeto)
 * - @Auth({ permissions: ['recipes:create'] }) - Autenticación + Permisos
 * - @Auth({ roles: [UserRole.ADMIN], permissions: ['users:delete'] }) - Todo
 *
 * @param rolesOrOptions - Roles como argumentos separados, array, u objeto con opciones
 */
export function Auth(
  ...rolesOrOptions: (
    | UserRole
    | UserRole[]
    | { roles?: UserRole[]; permissions?: string[] }
  )[]
) {
  let roles: UserRole[] | undefined;
  let perms: string[] | undefined;

  // Si no hay argumentos, solo autenticación
  if (rolesOrOptions.length === 0) {
    roles = undefined;
    perms = undefined;
  }
  // Si el primer argumento es un objeto, es el formato nuevo
  else if (
    typeof rolesOrOptions[0] === 'object' &&
    !Array.isArray(rolesOrOptions[0]) &&
    'roles' in rolesOrOptions[0]
  ) {
    const options = rolesOrOptions[0];
    roles = options.roles;
    perms = options.permissions;
  }
  // Si son argumentos separados (UserRole, UserRole, ...) o un array
  else {
    // Recopilar todos los roles de los argumentos
    const allRoles: UserRole[] = [];
    for (const arg of rolesOrOptions) {
      if (Array.isArray(arg)) {
        allRoles.push(...arg);
      } else if (typeof arg === 'string') {
        allRoles.push(arg);
      }
    }
    roles = allRoles.length > 0 ? allRoles : undefined;
    perms = undefined;
  }

  const decorators: (ClassDecorator | MethodDecorator | PropertyDecorator)[] = [
    ApiBearerAuth(),
    ApiSecurity('x-api-key'),
  ];

  const guards: (Type<CanActivate> | CanActivate)[] = [JwtAuthGuard]; // Siempre necesario para autenticación

  // Agregar metadata y guard de roles solo si se especifican roles
  if (roles && roles.length > 0) {
    decorators.push(Roles(...roles));
    guards.push(UserRoleGuard);
  }

  // Agregar metadata y guard de permisos solo si se especifican permisos
  if (perms && perms.length > 0) {
    decorators.push(RequirePermissions(...perms));
    guards.push(PermissionsGuard);
  }

  // Usar todos los guards necesarios en una sola llamada (sin duplicados)
  decorators.push(UseGuards(...guards));

  return applyDecorators(...decorators);
}

/**
 * @deprecated Usa @Auth() en su lugar. Este decorador se mantiene por compatibilidad.
 * Decorador para autenticación con verificación de roles únicamente
 */
export function AuthRoles(...roles: UserRole[]) {
  return Auth({ roles });
}
