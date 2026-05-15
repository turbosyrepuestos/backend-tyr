import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class ApiKeyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    if (request.headers['authorization']) {
      // Transfiere el token de 'Authorization' a 'x-api-key' si existe
      request.headers['x-api-key'] = request.headers['authorization'];
    }
    return next.handle();
  }
}
