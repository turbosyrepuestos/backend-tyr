import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role } from '../entities/role.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<Role>,
  ) {}

  async findByName(name: string): Promise<Role | null> {
    return await this.roleModel.findOne({ name }).exec();
  }

  async getPermissionsByRoleName(roleName: string): Promise<string[]> {
    const role = await this.findByName(roleName);
    return role ? role.permissions : [];
  }

  async create(name: string, permissions: string[]): Promise<Role> {
    const newRole = new this.roleModel({ name, permissions });
    return await newRole.save();
  }
}
