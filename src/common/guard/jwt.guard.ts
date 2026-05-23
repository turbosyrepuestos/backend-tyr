import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Token no enviado. Incluye el header: Authorization: Bearer <tu_access_token>',
      );
    }
    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser,
    info: unknown,
  ): TUser {
    if (err || !user) {
      const message =
        (err instanceof Error ? err.message : null) ||
        (info instanceof Error ? info.message : null) ||
        'Token inválido o expirado. Inicia sesión de nuevo.';

      if (err instanceof Error) {
        throw err;
      }
      throw new UnauthorizedException(message);
    }
    return user;
  }
}
