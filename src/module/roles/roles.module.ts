import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoleService } from './services/role.service';
import { Role, RoleSchema } from './entities/role.entity';
import { RolesSeeder } from '../../database/seeders/roles.seeder';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }]),
  ],
  providers: [RoleService, RolesSeeder],
  exports: [RoleService, RolesSeeder],
})
export class RolesModule {}
