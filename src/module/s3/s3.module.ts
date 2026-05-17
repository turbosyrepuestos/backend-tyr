import { Module } from '@nestjs/common';
import { S3Service } from './s3.service';
import { UploadS3Controller } from './s3.controller';
import { UploadImageToS3Interceptor } from './interceptors/upload-image-to-s3.interceptor';
import { RolesModule } from 'src/module/roles/roles.module';

@Module({
  imports: [RolesModule],
  controllers: [UploadS3Controller],
  providers: [S3Service, UploadImageToS3Interceptor],
  exports: [S3Service, UploadImageToS3Interceptor],
})
export class S3Module {}
