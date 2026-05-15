import { Controller, Post, Body } from '@nestjs/common';
import { ApiKeyService } from './apikey.service';
import { ApiKeyDto } from './dto/create-apikey.dto';
import { ApiTags } from '@nestjs/swagger';
import { Secure } from 'src/common/decorators/secure.decorator';
import { UserRole } from 'src/common/guard/roles.enum';
@ApiTags('ApiKey')
@Controller('ApiKey')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post('createApiKey')
  @Secure([UserRole.ADMIN], ['apikey:create'])
  async createApiKey(@Body() apiKeyDto: ApiKeyDto) {
    return await this.apiKeyService.createApiKey(apiKeyDto);
  }
}
