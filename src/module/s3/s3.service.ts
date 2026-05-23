import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import type { S3UploadResult } from './interfaces/s3-upload-result.interface';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly publicBaseUrl?: string;

  constructor(private readonly config: ConfigService) {
    const region =
      process.env.AWS_REGION ?? process.env.S3_REGION ?? 'us-west-2';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const bucketName = process.env.AWS_S3_BUCKET_NAME;

    if (!accessKeyId || !secretAccessKey || !bucketName) {
      this.logger.warn(
        'S3: faltan AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY o AWS_S3_BUCKET_NAME',
      );
    }

    this.region = region;
    this.bucketName = bucketName ?? '';
    this.publicBaseUrl = process.env.AWS_S3_PUBLIC_BASE_URL;

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<S3UploadResult> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Archivo de imagen vacío o inválido');
    }
    if (!this.bucketName) {
      throw new InternalServerErrorException('Bucket S3 no configurado');
    }

    const extension = this.resolveExtension(file);
    const fileName = `${randomUUID()}.${extension}`;
    const key = folder ? `${folder.replace(/\/$/, '')}/${fileName}` : fileName;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      return {
        imageUrl: this.buildPublicUrl(key),
        key,
        originalFileName: file.originalname,
      };
    } catch (err) {
      this.logger.error(
        'Error subiendo archivo a S3',
        err instanceof Error ? err.stack : String(err),
      );
      throw new InternalServerErrorException('No ubir la imagen a S3');
    }
  }

  private resolveExtension(file: Express.Multer.File): string {
    const fromName = file.originalname?.split('.').pop()?.toLowerCase();
    if (fromName && /^[a-z0-9]+$/.test(fromName)) {
      return fromName;
    }
    const mimeMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
    };
    return mimeMap[file.mimetype] ?? 'jpg';
  }

  private buildPublicUrl(key: string): string {
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl.replace(/\/$/, '')}/${key}`;
    }
    if (this.region === 'us-west-2') {
      return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
    }
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }
}
