import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RoleService } from '../../module/roles/services/role.service';

@Injectable()
export class RolesSeeder implements OnModuleInit {
  private readonly logger = new Logger(RolesSeeder.name);

  constructor(private readonly roleService: RoleService) {}

  async onModuleInit() {
    await this.seedDefaults();
  }

  /**
   * Idempotente; útil también desde scripts (p. ej. `src/seeders/seed.ts`).
   */
  async seed(): Promise<void> {
    await this.seedDefaults();
  }

  private async seedDefaults() {
    const defaults: { name: string; permissions: string[] }[] = [
      {
        name: 'user',
        permissions: ['products:read'],
      },
      {
        name: 'admin',
        permissions: ['*'],
      },
      {
        name: 'super_admin',
        permissions: ['*'],
      },
    ];

    for (const def of defaults) {
      const existing = await this.roleService.findByName(def.name);
      if (!existing) {
        await this.roleService.create(def.name, def.permissions);
        this.logger.log(`Rol por defecto creado: ${def.name}`);
      }
    }
  }
}
