import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import {
  S3_UPLOAD_FIELD_KEY,
  S3_UPLOAD_FOLDER_KEY,
  S3_UPLOAD_REQUIRED_KEY,
  S3_UPLOAD_RESULT_KEY,
  S3_UPLOAD_URL_KEY,
} from '../constants/s3-upload.constants';
import { S3Service } from '../s3.service';

/**
 * Sube `request.file` a S3 y expone la URL en el request para @S3UploadedUrl().
 * Usar junto con @UploadImageToS3() (incluye FileInterceptor + memoria).
 */
@Injectable()
export class UploadImageToS3Interceptor implements NestInterceptor {
  constructor(
    private readonly s3Service: S3Service,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<{
      file?: Express.Multer.File;
      [S3_UPLOAD_RESULT_KEY]?: unknown;
      [S3_UPLOAD_URL_KEY]?: string;
    }>();

    const field =
      this.reflector.getAllAndOverride<string>(S3_UPLOAD_FIELD_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'file';

    const folder = this.reflector.getAllAndOverride<string | undefined>(
      S3_UPLOAD_FOLDER_KEY,
      [context.getHandler(), context.getClass()],
    );

    const required =
      this.reflector.getAllAndOverride<boolean>(S3_UPLOAD_REQUIRED_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false;

    const file = request.file;
    if (!file) {
      if (required) {
        throw new BadRequestException(
          `Se requiere un archivo en el campo "${field}"`,
        );
      }
      return next.handle();
    }

    const result = await this.s3Service.uploadFile(file, folder);
    request[S3_UPLOAD_RESULT_KEY] = result;
    request[S3_UPLOAD_URL_KEY] = result.imageUrl;

    return next.handle();
  }
}
