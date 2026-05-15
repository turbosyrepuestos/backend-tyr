import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token para obtener un nuevo access token',
    example: 'abc123def456...',
  })
  @IsString({ message: 'El refresh token debe ser un string' })
  @IsNotEmpty({ message: 'El refresh token es requerido' })
  refresh_token: string;
}
