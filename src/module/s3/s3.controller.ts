import { BadRequestException, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Secure } from 'src/common/decorators/secure.decorator';
import { UserRole } from 'src/common/guard/roles.enum';
import { UploadImageToS3 } from './decorators/upload-image-to-s3.decorator';
import {
  S3Uploaded,
  S3UploadedUrl,
} from './decorators/s3-uploaded-url.decorator';
import type { S3UploadResult } from './interfaces/s3-upload-result.interface';

@ApiTags('s3')
@Secure([UserRole.ADMIN, UserRole.USER], ['s3:upload'])
@Controller('s3')
export class UploadS3Controller {
  @Post('upload')
  @UploadImageToS3('file', { folder: 'uploads', required: true })
  @ApiOperation({ summary: 'Subir imagen al bucket S3' })
  @ApiResponse({ status: 201, description: 'URL pública de la imagen' })
  @ApiResponse({ status: 400, description: 'Archivo inválido o faltante' })
  uploadImage(
    @S3UploadedUrl() imageUrl: string,
    @S3Uploaded() upload: S3UploadResult | undefined,
  ) {
    if (!imageUrl || !upload) {
      throw new BadRequestException('No se recibió la imagen');
    }
    return {
      imageUrl,
      key: upload.key,
      originalFileName: upload.originalFileName,
    };
  }
}
