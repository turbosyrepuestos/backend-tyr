import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  S3_UPLOAD_RESULT_KEY,
  S3_UPLOAD_URL_KEY,
} from '../constants/s3-upload.constants';
import type { S3UploadResult } from '../interfaces/s3-upload-result.interface';

/** URL pública de la imagen subida por UploadImageToS3Interceptor. */
export const S3UploadedUrl = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<{
      [S3_UPLOAD_URL_KEY]?: string;
    }>();
    return request[S3_UPLOAD_URL_KEY];
  },
);

/** Resultado completo del upload (url, key, nombre original). */
export const S3Uploaded = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): S3UploadResult | undefined => {
    const request = ctx.switchToHttp().getRequest<{
      [S3_UPLOAD_RESULT_KEY]?: S3UploadResult;
    }>();
    return request[S3_UPLOAD_RESULT_KEY];
  },
);
