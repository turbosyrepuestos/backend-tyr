import { PartialType } from '@nestjs/swagger';
import { ApiKeyDto } from './create-apikey.dto';

export class UpdateApiKeyDto extends PartialType(ApiKeyDto) {}
