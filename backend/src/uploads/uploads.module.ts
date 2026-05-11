import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { LegacyS3Controller } from './legacy-s3.controller';
import { UploadsService } from './uploads.service';
import { S3Service } from './s3.service';

@Module({
  controllers: [UploadsController, LegacyS3Controller],
  providers: [UploadsService, S3Service],
  exports: [S3Service],
})
export class UploadsModule {}
