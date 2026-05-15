import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiKeyController } from './apikey.controller';
import { ApiKeyService } from './apikey.service';
import { ApiKey, ApiKeySchema } from './entities/apikey.entitie';
import { ApiKeyGuard } from 'src/common/guard/x-api-key/x-api-key.guard';
import { RolesModule } from 'src/module/roles/roles.module';
import { UserRoleGuard } from 'src/common/guard/role.guard';
import { PermissionsGuard } from 'src/common/guard/permissions.guard';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: ApiKey.name, schema: ApiKeySchema }]),
    RolesModule,
  ],
  controllers: [ApiKeyController],
  providers: [ApiKeyService, ApiKeyGuard, UserRoleGuard, PermissionsGuard],
  exports: [ApiKeyService],
})
export class ApiKeyModule {}
