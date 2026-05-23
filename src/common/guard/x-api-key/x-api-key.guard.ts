import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeyService } from '../../../common/utils/apikey/apikey.service';
import { Request } from 'express';
import { ApiKey } from 'src/common/utils/apikey/entities/apikey.entitie';

interface RequestWithApiKey extends Request {
  apiKey?: ApiKey;
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithApiKey>();

    // Normalizamos el path a minúsculas para evitar problemas de casing
    const publicPaths = ['/api', '/api-json', '/api-yaml', '/favicon.ico', '/'];
    if (publicPaths.includes(request.path) || request.path.includes('/api')) {
      return true;
    }

    const apiKeyHeader = request.headers['x-api-key'];

    if (!apiKeyHeader) {
      throw new UnauthorizedException('API key is missing');
    }

    const apiKeyDoc = await this.apiKeyService.validateApiKey(
      Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader,
    );
    request.apiKey = apiKeyDoc;
    return true;
  }
}
