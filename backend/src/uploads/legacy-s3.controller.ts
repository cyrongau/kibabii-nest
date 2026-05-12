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
    const key = params['0'] || params['*'] || params['path'] || '';
    
    let realBucket = bucket;
    let finalKey = key;
    
    if (Array.isArray(finalKey)) {
      finalKey = finalKey.join('/');
    }

    // HEALER: If the bucket is a generic prefix, extract the real bucket from the key
    const genericPrefixes = ['uploads', 's3', 'proxy'];
    if (genericPrefixes.includes(realBucket)) {
      const segments = finalKey.split('/').filter(s => s && !genericPrefixes.includes(s));
      if (segments.length >= 2) {
        realBucket = segments[0];
        finalKey = segments.slice(1).join('/');
        console.log(`♻️ Healed Legacy Bucket/Key: ${realBucket} / ${finalKey}`);
      }
    }

    // Secondary cleanup for double-prefixing
    const redundantPrefixes = ['uploads/proxy/', 's3/', 'proxy/'];
    for (const prefix of redundantPrefixes) {
      if (finalKey.startsWith(prefix)) {
        finalKey = finalKey.substring(prefix.length);
      }
    }

    // Handle double-bucket nesting
    if (finalKey.startsWith(`${realBucket}/`)) {
      finalKey = finalKey.substring(realBucket.length + 1);
    }
    
    console.log(`🔍 Final Legacy Proxy Request -> Bucket: ${realBucket}, Key: ${finalKey}`);
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
