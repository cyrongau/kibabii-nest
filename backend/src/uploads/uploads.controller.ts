import { 
  Controller, 
  Post, 
  Get,
  Param,
  UseInterceptors, 
  UploadedFile,
  Res,
  BadRequestException,
  Query
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import * as express from 'express';
import { S3Service } from './s3.service';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

@Controller('uploads')
export class UploadsController {
  private readonly s3ProxyClient: S3Client;

  constructor(private readonly s3Service: S3Service) {
    this.s3ProxyClient = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY as string,
        secretAccessKey: process.env.S3_SECRET_KEY as string,
      },
      forcePathStyle: true,
    });
  }

  @Get('proxy/:bucket/*')
  async proxyFile(@Param() params: any, @Res() res: express.Response) {
    console.log('📦 All params:', params);
    const bucket = params.bucket;
    const key = params['0'] || params['*'] || '';

    if (!key) {
      console.error('❌ No key provided in proxy request');
      return res.status(400).json({ error: 'No key provided' });
    }

    let finalKey = key;
    // Handle double-bucket nesting if S3_PUBLIC_URL was misconfigured
    if (finalKey.startsWith(`${bucket}/`)) {
      finalKey = finalKey.substring(bucket.length + 1);
    }
    console.log(`🔍 Proxying request for bucket: ${bucket}, key: ${finalKey}`);
    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: finalKey,
      });
      const response = await this.s3ProxyClient.send(command);
      const contentType = response.ContentType || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      const stream = response.Body as any;
      stream.pipe(res);
    } catch (error: any) {
      console.error(`❌ Proxy error for ${bucket}/${finalKey}:`, error.message);
      if (error.$metadata?.httpStatusCode === 404) {
        res.status(404).json({ error: 'File not found' });
      } else {
        res.status(500).json({ error: 'Failed to retrieve file' });
      }
    }
  }

  // Fallback for URLs missing the /proxy prefix
  @Get(':bucket/*')
  async proxyFileFallback(@Param() params: any, @Res() res: express.Response) {
    return this.proxyFile(params, res);
  }

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
