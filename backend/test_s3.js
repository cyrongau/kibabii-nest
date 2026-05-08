const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

async function testUpload() {
  const s3Client = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
    },
    forcePathStyle: true,
  });

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || 'kibabii-nest',
      Key: 'test-upload-' + Date.now() + '.txt',
      Body: 'Hello from test script',
      ContentType: 'text/plain',
      ACL: 'public-read',
    });

    const response = await s3Client.send(command);
    console.log('✅ Upload successful:', response);
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
  }
}

testUpload();
