import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeyService } from '../../../common/utils/apikey/apikey.service';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();

    // Normalizamos el path a minúsculas para evitar problemas de casing
    const publicPaths = ['/api', '/api-json', '/api-yaml', '/favicon.ico', '/'];
    if (publicPaths.includes(request.path) || request.path.includes('/api')) {
      return true;
    }

    const apiKeyHeader = request.headers['x-api-key'];

    if (!apiKeyHeader) {
      throw new UnauthorizedException('API key is missing');
    }

    const apiKeyDoc = await this.apiKeyService.validateApiKey(apiKeyHeader.toString());
    (request as any).apiKey = apiKeyDoc;
    return true;
  }
}
