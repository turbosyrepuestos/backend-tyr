import {
  IsString,
  IsOptional,
  IsObject,
  IsIn,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'juan' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ example: 'Pérez' })
  @IsOptional()
  @IsString()
  lastname?: string;

  @ApiPropertyOptional({
    example: { countryCode: '+57', phoneNumber: '3001234567' },
  })
  @IsOptional()
  @IsObject()
  phone?: {
    countryCode: string;
    phoneNumber: string;
  };

  @ApiPropertyOptional({ example: 'Colombia' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'Bogotá' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'https://example.com/photo.jpg' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({ enum: ['user', 'admin', 'super_admin'] })
  @IsOptional()
  @IsString()
  @IsIn(['user', 'admin', 'super_admin'])
  role?: string;

  @ApiPropertyOptional({ description: 'Activar o desactivar usuario' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
