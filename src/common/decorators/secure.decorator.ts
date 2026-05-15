/**
 * @deprecated Usa @Auth() en su lugar. Este decorador se mantiene por compatibilidad.
 *
 * Decorador combinado que incluye autenticación JWT, verificación de roles y permisos
 * @param roles Roles permitidos (opcional)
 * @param permissions Permisos requeridos (opcional)
 */
import { UserRole } from '../guard/roles.enum';
import { Auth } from './auth.decorator';

export function Secure(roles?: UserRole[], permissions?: string[]) {
  return Auth({ roles, permissions });
}
