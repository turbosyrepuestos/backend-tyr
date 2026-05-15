import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiKey } from './entities/apikey.entitie';
import { ApiKeyDto } from './dto/create-apikey.dto';

@Injectable()
export class ApiKeyService {
  constructor(@InjectModel(ApiKey.name) private apiKeyModel: Model<ApiKey>) {}

  async validateApiKey(key: string): Promise<ApiKey> {
    const apiKey = await this.apiKeyModel
      .findOne({ key, isActive: true })
      .exec();

    if (!apiKey) {
      throw new UnauthorizedException('Invalid or missing API key');
    }

    return apiKey;
  }

  // Método para crear nuevas claves de API (opcional)
  async createApiKey(apiKeyDto: ApiKeyDto) {
    const key = this.generateApiKey(); // Genera la API key

    const { systemName, emailTemplates } = apiKeyDto;

    if (typeof systemName !== 'string') {
      throw new Error('systemName must be a string');
    }

    // Crea la nueva API Key con el systemName y la key generada
    const newApiKey = new this.apiKeyModel({
      key,
      systemName,
      emailTemplates,
    });
    return await newApiKey.save();
  }

  // Generador de API Key (puedes personalizarlo)
  private generateApiKey(): string {
    return [...Array(30)].map(() => (Math.random() * 36).toString(36)).join('');
  }
}
