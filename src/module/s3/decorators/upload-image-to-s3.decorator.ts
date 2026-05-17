import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import {
  S3_UPLOAD_FIELD_KEY,
  S3_UPLOAD_FOLDER_KEY,
  S3_UPLOAD_REQUIRED_KEY,
} from '../constants/s3-upload.constants';
import { createImageMulterOptions } from '../config/image-multer.config';
import { UploadImageToS3Interceptor } from '../interceptors/upload-image-to-s3.interceptor';

export interface UploadImageToS3Options {
  /** Prefijo en el bucket, ej. `products` → `products/uuid.jpg` */
  folder?: string;
  maxSizeMb?: number;
  /** Si true, falla cuando no viene archivo en el campo */
  required?: boolean;
}

/**
 * Decorador compuesto: multer (memoria) + subida a S3.
 * En el handler usa @S3UploadedUrl() para obtener la URL y guardarla en BD.
 *
 * @example
 * @Post()
 * @UploadImageToS3('image', { folder: 'products', required: true })
 * create(@Body() dto: CreateDto, @S3UploadedUrl() imageUrl: string) {
 *   return this.service.create({ ...dto, imageUrl });
 * }
 */
export function UploadImageToS3(
  field = 'file',
  options?: UploadImageToS3Options,
) {
  return applyDecorators(
    SetMetadata(S3_UPLOAD_FIELD_KEY, field),
    SetMetadata(S3_UPLOAD_FOLDER_KEY, options?.folder),
    SetMetadata(S3_UPLOAD_REQUIRED_KEY, options?.required ?? false),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: options?.required ? [field] : undefined,
        properties: {
          [field]: { type: 'string', format: 'binary' },
        },
      },
    }),
    UseInterceptors(
      FileInterceptor(field, createImageMulterOptions(options?.maxSizeMb)),
      UploadImageToS3Interceptor,
    ),
  );
}
