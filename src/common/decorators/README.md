# Decoradores de Seguridad

Este módulo contiene decoradores unificados para manejar autenticación, autorización y permisos de manera eficiente.

## Decorador Principal: `@Auth()`

Decorador unificado que combina autenticación JWT, verificación de roles y permisos **sin duplicar guards**. Usa solo los guards necesarios en una sola llamada.

### Formas de Uso

```typescript
import { Auth } from 'src/common/decorators/auth.decorator';
import { UserRole } from 'src/common/guard/roles.enum';

// Solo autenticación JWT
@Auth()
@Get('profile')
getProfile() { }

// Autenticación + Roles (formato antiguo - compatibilidad)
@Auth(UserRole.ADMIN)
@Get('all')
findAll() { }

// Autenticación + Múltiples roles
@Auth(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Get('admin-data')
getAdminData() { }

// Autenticación + Roles (formato objeto)
@Auth({ roles: [UserRole.ADMIN] })
@Post('create')
create() { }

// Autenticación + Permisos
@Auth({ permissions: ['recipes:create'] })
@Post('recipes')
createRecipe() { }

// Autenticación + Roles + Permisos
@Auth({ roles: [UserRole.ADMIN], permissions: ['users:delete'] })
@Delete('users/:id')
deleteUser() { }
```

## Decoradores Adicionales

### `@Secure()` - Deprecado

⚠️ **Deprecado**: Usa `@Auth()` en su lugar. Este decorador se mantiene por compatibilidad.

```typescript
import { Secure } from 'src/common/decorators/secure.decorator';

// Equivalente a @Auth()
@Secure()
@Get('profile')
getProfile() { }

// Equivalente a @Auth({ roles: [UserRole.ADMIN] })
@Secure([UserRole.ADMIN])
@Post('create')
create() { }
```

### `@RequirePermissions(...permissions)`

Decorador para especificar permisos requeridos (debe usarse con `PermissionsGuard` manualmente).

```typescript
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/common/guard/permissions.guard';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guard/jwt.guard';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('recipes:create', 'recipes:update')
@Post('recipes')
createRecipe() { }
```

**Nota**: Es más fácil usar `@Auth({ permissions: [...] })` que manejar los guards manualmente.

**Importante**: Los permisos **no** van en el JWT. El `PermissionsGuard` obtiene los permisos del rol del usuario desde la BD en cada petición. Cualquier módulo que use `@Auth({ permissions: [...] })` o `PermissionsGuard` debe **importar `RolesModule`**.

## Sistema de Permisos

Los permisos se almacenan en la colección `Role` de MongoDB. Cada rol tiene un array de permisos. El JWT solo incluye el nombre del rol (`role`); los permisos se resuelven en el guard.

### Formato de Permisos

Los permisos siguen el formato: `recurso:accion` o `recurso:*` (wildcard)

Ejemplos:
- `recipes:read` - Leer recetas
- `recipes:create` - Crear recetas
- `recipes:update` - Actualizar recetas
- `recipes:delete` - Eliminar recetas
- `recipes:*` - Todos los permisos de recetas
- `*` - Todos los permisos

### Permisos por Defecto

Si un rol no existe en la base de datos, se usan permisos por defecto:

- **user**: `recipes:read`, `recipes:read:own`, `recipes:create:own`, `recipes:update:own`, `recipes:delete:own`, `profile:read`, `profile:update`
- **admin**: `recipes:read`, `recipes:create`, `recipes:update`, `recipes:delete`, `users:read`, `users:update`, `profile:read`, `profile:update`
- **super_admin**: `*` (todos los permisos)

### Permisos en JWT

Los permisos se incluyen automáticamente en el JWT cuando el usuario hace login. Están disponibles en `req.user.permissions`.

## Ejemplo de Uso Completo

```typescript
import { Controller, Get, Post, Delete } from '@nestjs/common';
import { Auth } from 'src/common/decorators/auth.decorator';
import { UserRole } from 'src/common/guard/roles.enum';

@Controller('recipes')
export class RecipesController {
  
  // Solo requiere autenticación
  @Auth()
  @Get('my-recipes')
  getMyRecipes() { }

  // Requiere rol ADMIN (formato antiguo - compatibilidad)
  @Auth(UserRole.ADMIN)
  @Post('create')
  createRecipe() { }

  // Requiere permiso específico
  @Auth({ permissions: ['recipes:delete'] })
  @Delete(':id')
  deleteRecipe() { }

  // Requiere rol ADMIN Y permiso específico
  @Auth({ roles: [UserRole.ADMIN], permissions: ['users:delete'] })
  @Delete('users/:id')
  deleteUser() { }
}
```

## Ventajas del Decorador Unificado

✅ **Sin redundancia**: Usa solo los guards necesarios, sin duplicar `JwtAuthGuard`  
✅ **Flexible**: Soporta múltiples formatos de uso  
✅ **Eficiente**: Una sola llamada a `UseGuards()` con todos los guards necesarios  
✅ **Compatible**: Mantiene compatibilidad con el código existente  
✅ **Mantenible**: Un solo decorador para todas las necesidades de seguridad
