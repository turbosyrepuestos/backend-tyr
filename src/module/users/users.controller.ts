import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { UserService } from './services/users.service';
import { UserQueryDto } from './dto/user-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Auth } from 'src/common/decorators/auth.decorator';
import { UserRole } from 'src/common/guard/roles.enum';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Auth({ roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] })
  @ApiOperation({
    summary: 'Obtener usuarios con filtros y paginación',
    description:
      'Filtra por username, email, rol, país, ciudad, isActive y búsqueda global (q). Paginado.',
  })
  @ApiResponse({ status: 200, description: 'Lista paginada de usuarios.' })
  findAll(@Query() queryDto: UserQueryDto) {
    return this.userService.findAllPaginated(queryDto);
  }

  @Get(':id')
  @Auth({ roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] })
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  @ApiParam({ name: 'id', description: 'ID del usuario (MongoDB ObjectId)' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado (sin password).' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.userService.findOneByIdPublic(id);
  }

  @Patch(':id')
  @Auth({ roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] })
  @ApiOperation({ summary: 'Actualizar un usuario por ID' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado (sin password).' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Auth({ roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] })
  @ApiOperation({
    summary: 'Desactivar un usuario (soft delete)',
    description: 'Marca isActive = false. No borra el registro de la base de datos.',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario desactivado.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  softDelete(@Param('id') id: string) {
    return this.userService.softDelete(id);
  }

  @Patch(':id/restore')
  @Auth({ roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] })
  @ApiOperation({
    summary: 'Reactivar un usuario previamente desactivado',
    description: 'Marca isActive = true.',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario reactivado.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  restore(@Param('id') id: string) {
    return this.userService.restore(id);
  }
}
