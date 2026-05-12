import { Controller, Get, Param, Res } from '@nestjs/common';
import * as express from 'express';
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

  @Get(':bucket/*')
  async proxyLegacyFile(@Param() params: any, @Res() res: express.Response) {
    console.log('📦 Legacy params:', params);
    const bucket = params.bucket;
    let key = params['0'] || params['*'] || params['path'] || '';
    
    if (Array.isArray(key)) {
      key = key.join('/');
    }
    
    if (!key) {
      console.error('❌ No key provided in legacy proxy request');
      return res.status(400).json({ error: 'No key provided' });
    }

    let finalKey = key;
    // Handle double-bucket nesting if S3_PUBLIC_URL was misconfigured
    if (finalKey.startsWith(`${bucket}/`)) {
      finalKey = finalKey.substring(bucket.length + 1);
    }
    console.log(`🔍 Legacy proxying for bucket: ${bucket}, key: ${finalKey}`);
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
      
      // Handle stream errors
      stream.on('error', (err: any) => {
        console.error('❌ Legacy stream error during proxy:', err.message);
        if (!res.headersSent) {
          res.status(502).json({ error: 'Upstream connection to S3 failed' });
        }
      });

      stream.pipe(res);
    } catch (error: any) {
      console.error(`❌ Legacy proxy error for ${bucket}/${finalKey}:`, error.message);
      if (error.$metadata?.httpStatusCode === 404) {
        res.status(404).json({ error: 'File not found' });
      } else {
        res.status(500).json({ error: 'Failed to retrieve file' });
      }
    }
  }
}
