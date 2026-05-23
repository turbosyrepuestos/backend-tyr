import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'recetarium1234@yopmail.com' })
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) => (value as string).toLowerCase())
  email: string;

  @ApiProperty({ example: 'juan' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  lastname: string;

  @ApiProperty({ example: 'password' })
  @IsNotEmpty()
  @MinLength(8, { message: 'password should be minimmum 8' })
  @MaxLength(50, { message: 'password should be maximium 50' })
  password: string;

  @ApiProperty({ example: { countryCode: '+57', phoneNumber: '3001234567' } })
  @IsObject()
  phone: {
    countryCode: string;
    phoneNumber: string;
  };

  @ApiProperty({ example: 'Colombia' })
  @IsString()
  country: string;

  @ApiProperty({ example: 'Bogotá' })
  @IsString()
  city: string;

  @ApiProperty()
  @IsString()
  @IsOptional() // Photo no es obligatorio
  photoUrl?: string;

  @ApiProperty({ enum: ['user', 'admin'] })
  @IsString()
  @IsIn(['user', 'admin'])
  role: string;
}
