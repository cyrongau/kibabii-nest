import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFile, 
  BadRequestException,
  Query
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { S3Service } from './s3.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly s3Service: S3Service) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        return cb(new BadRequestException('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    }
  }))
  async uploadImage(@UploadedFile() file: Express.Multer.File, @Query('folder') folder: string) {
    if (!file) throw new BadRequestException('No file uploaded');
    const url = await this.s3Service.uploadFile(file, folder || 'images');
    return { url };
  }

  @Post('document')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|pdf)$/)) {
        return cb(new BadRequestException('Only image and PDF files are allowed!'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB for documents
    }
  }))
  async uploadDocument(@UploadedFile() file: Express.Multer.File, @Query('folder') folder: string) {
    if (!file) throw new BadRequestException('No file uploaded');
    const url = await this.s3Service.uploadFile(file, folder || 'documents');
    return { url };
  }

  @Post('video')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(mp4|webm|ogg|quicktime)$/)) {
        return cb(new BadRequestException('Only video files are allowed!'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB for video
    }
  }))
  async uploadVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const url = await this.s3Service.uploadFile(file, 'videos');
    return { url };
  }
}
