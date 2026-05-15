import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class GenerateOtpDto {
  @ApiProperty({
    description: 'Email del usuario para enviar el OTP',
    example: 'usuario@ejemplo.com',
  })
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @ApiProperty({
    description: 'Password del usuario para enviar el OTP',
    example: 'password',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
