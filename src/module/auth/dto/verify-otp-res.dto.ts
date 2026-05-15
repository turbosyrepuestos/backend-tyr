import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpResponseDto {
  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Código OTP verificado exitosamente. Login completado',
  })
  message: string;

  @ApiProperty({
    description: 'ID del usuario',
    example: '507f1f77bcf86cd799439011',
  })
  userId: string;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@ejemplo.com',
  })
  email: string;

  @ApiProperty({
    description: 'Nombre de usuario',
    example: 'juan',
  })
  username: string;

  @ApiProperty({
    description: 'Rol del usuario',
    example: 'user',
    enum: ['user', 'admin', 'super_admin'],
  })
  role: string;

  @ApiProperty({
    description: 'Permisos del usuario basados en su rol',
    example: ['recipes:read', 'recipes:create:own', 'profile:read'],
    type: [String],
  })
  permissions: string[];

  @ApiProperty({
    description: 'Access token JWT',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Refresh token para renovar el access token',
    example: 'abc123def456ghi789...',
  })
  refresh_token: string;
}
