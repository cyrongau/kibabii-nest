import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

@Controller('s3')
export class LegacyS3Controller {
  private readonly s3ProxyClient: S3Client;

  constructor() {
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

  @Get(':bucket/*key')
  async proxyLegacyFile(@Param('bucket') bucket: string, @Param('key') key: string, @Res() res: Response) {
    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });
      const response = await this.s3ProxyClient.send(command);
      const contentType = response.ContentType || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      const stream = response.Body as any;
      stream.pipe(res);
    } catch (error: any) {
      if (error.$metadata?.httpStatusCode === 404) {
        res.status(404).json({ error: 'File not found' });
      } else {
        res.status(500).json({ error: 'Failed to retrieve file' });
      }
    }
  }
}
