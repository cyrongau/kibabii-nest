import { 
  Controller, 
  Post, 
  Get,
  Param,
  UseInterceptors, 
  UploadedFile,
  Res,
  BadRequestException,
  InternalServerErrorException,
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
    const bucket = params.bucket;
    const key = params['0'] || params['*'] || params['path'] || '';
    
    let realBucket = bucket;
    let finalKey = key;
    
    if (Array.isArray(finalKey)) {
      finalKey = finalKey.join('/');
    }

    // HEALER: If the bucket is a generic prefix, extract the real bucket from the key
    const genericPrefixes = ['uploads', 's3', 'proxy'];
    const defaultBucket = process.env.S3_BUCKET_NAME || 'kibabii-nest';
    
    if (genericPrefixes.includes(realBucket)) {
      const segments = finalKey.split('/').filter(s => s && !genericPrefixes.includes(s));
      if (segments.length >= 2) {
        realBucket = segments[0];
        finalKey = segments.slice(1).join('/');
        console.log(`♻️ Healed Legacy Bucket/Key: ${realBucket} / ${finalKey}`);
      } else if (segments.length === 1) {
        realBucket = defaultBucket;
        finalKey = segments[0];
        console.log(`♻️ Healed to Default Bucket: ${realBucket} / ${finalKey}`);
      }
    }

    // Secondary cleanup for double-prefixing and leading slashes
    const redundantPrefixes = ['uploads/proxy/', 's3/', 'proxy/', 'uploads/'];
    for (const prefix of redundantPrefixes) {
      if (finalKey.startsWith(prefix)) {
        finalKey = finalKey.substring(prefix.length);
      }
    }

    // Handle double-bucket nesting
    if (finalKey.startsWith(`${realBucket}/`)) {
      finalKey = finalKey.substring(realBucket.length + 1);
    }

    if (!finalKey) {
      console.error('❌ No key provided after healing');
      return res.status(400).json({ error: 'No key provided' });
    }

    console.log(`🔍 Final Proxy Request -> Bucket: ${realBucket}, Key: ${finalKey}`);
    try {
      const command = new GetObjectCommand({
        Bucket: realBucket,
        Key: finalKey,
      });
      const response = await this.s3ProxyClient.send(command);
      const contentType = response.ContentType || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      const stream = response.Body as any;
      
      // Handle stream errors to prevent crashing/502
      stream.on('error', (err: any) => {
        console.error('❌ Stream error during proxy:', err.message);
        if (!res.headersSent) {
          res.status(502).json({ error: 'Upstream connection to S3 failed' });
        }
      });

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
    try {
      const url = await this.s3Service.uploadFile(file, folder || 'images');
      return { url };
    } catch (error: any) {
      console.error('Image upload failed:', error.message);
      throw new InternalServerErrorException('Failed to upload image. Please check storage service and try again.');
    }
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
    try {
      const url = await this.s3Service.uploadFile(file, folder || 'documents');
      return { url };
    } catch (error: any) {
      console.error('Document upload failed:', error.message);
      throw new InternalServerErrorException('Failed to upload document. Please check storage service and try again.');
    }
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
    try {
      const url = await this.s3Service.uploadFile(file, 'videos');
      return { url };
    } catch (error: any) {
      console.error('Video upload failed:', error.message);
      throw new InternalServerErrorException('Failed to upload video. Please check storage service and try again.');
    }
  }
}
