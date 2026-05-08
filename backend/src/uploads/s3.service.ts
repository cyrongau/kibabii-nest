import { Injectable, OnModuleInit } from '@nestjs/common';
import { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

@Injectable()
export class S3Service implements OnModuleInit {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY as string,
        secretAccessKey: process.env.S3_SECRET_KEY as string,
      },
      forcePathStyle: true, // Needed for MinIO
    });
    this.bucketName = process.env.S3_BUCKET_NAME || 'kibabii-nest';
  }

  async onModuleInit() {
    // Run asynchronously to prevent blocking the entire backend startup if MinIO is unresponsive
    this.ensureBucketExists().catch(err => {
      console.error('Failed to initialize MinIO bucket on startup:', err.message);
    });
  }

  private async ensureBucketExists() {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        console.log(`Creating bucket: ${this.bucketName}`);
        await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucketName }));
      }
    }

    // Always ensure public policy is set with proper MinIO syntax
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetBucketLocation', 's3:ListBucket'],
          Resource: [`arn:aws:s3:::${this.bucketName}`],
        },
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${this.bucketName}/*`],
        },
      ],
    };

    try {
      await this.s3Client.send(new PutBucketPolicyCommand({
        Bucket: this.bucketName,
        Policy: JSON.stringify(policy),
      }));
      console.log(`Public policy ensured for bucket: ${this.bucketName}`);
    } catch (e) {
      console.error('Error setting bucket policy. Ensure MinIO allows anonymous policies. Error:', e.message);
    }
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'uploads'): Promise<string> {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const fileName = `${folder}/${uniqueSuffix}-${safeOriginalName}`;

    try {
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
          // ACL: 'public-read', // Removed to avoid potential conflicts with MinIO policies
        },
      });

      await upload.done();
      console.log(`✅ File uploaded successfully to S3: ${fileName}`);
      return `${process.env.S3_PUBLIC_URL}/${fileName}`;
    } catch (error) {
      console.error(`❌ S3 Upload Error for file ${fileName}:`, error.message);
      console.error(`Bucket: ${this.bucketName}, Endpoint: ${process.env.S3_ENDPOINT}`);
      throw error;
    }
  }

  async getFileBase64(url: string): Promise<string> {
    const fileName = url.replace(`${process.env.S3_PUBLIC_URL}/`, '');
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
    });

    const response = await this.s3Client.send(command);
    const buffer = await response.Body?.transformToByteArray();
    if (!buffer) return '';
    
    return Buffer.from(buffer).toString('base64');
  }
}
