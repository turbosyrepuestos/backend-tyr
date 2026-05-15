import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApiKeyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  systemName: string;

  @ApiProperty({
    required: false,
    example: {
      login: {
        subject: 'Bienvenido a mi App',
        htmlContent: '<h1>Hola!</h1><p>Tu código es {{code}}</p>',
        senderName: 'Mi App',
      },
    },
  })
  @IsOptional()
  emailTemplates?: Map<
    string,
    {
      subject: string;
      htmlContent: string;
      senderName?: string;
      senderEmail?: string;
    }
  >;
}
