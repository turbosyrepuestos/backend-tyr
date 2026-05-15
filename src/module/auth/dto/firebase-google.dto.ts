import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class FirebaseGoogleDto {
  @ApiProperty({
    description:
      'ID token JWT entregado por Firebase Auth en el cliente tras signInWithPopup/signInWithCredential (Google).',
    example: 'eyJhbGciOiJSUzI1NiIs...',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
