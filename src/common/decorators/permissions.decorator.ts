import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorador para especificar los permisos requeridos para acceder a un endpoint
 * @param permissions Array de permisos requeridos (ej: ['recipes:create', 'users:delete'])
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
