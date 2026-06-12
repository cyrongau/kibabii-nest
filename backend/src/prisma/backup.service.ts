import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { S3Service } from '../uploads/s3.service';

const execPromise = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(private readonly s3Service: S3Service) {}

  /**
   * Run pg_dump on the active database and upload the custom format dump to S3/MinIO.
   */
  async runBackup(): Promise<string> {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const tempFileName = `db-backup-${timestamp}.dump`;
    const tempFilePath = path.join(process.cwd(), 'uploads', tempFileName);

    this.logger.log(`Starting database backup to temporary file: ${tempFilePath}`);

    try {
      // Ensure uploads directory exists
      if (!fs.existsSync(path.dirname(tempFilePath))) {
        fs.mkdirSync(path.dirname(tempFilePath), { recursive: true });
      }

      // Execute pg_dump using connection string
      // -F c: custom format (highly compressed, includes all metadata)
      // -b: include large objects
      // -v: verbose mode (optional, but good for logs if needed)
      const command = `pg_dump -d "${dbUrl}" -F c -b -f "${tempFilePath}"`;
      
      await execPromise(command);

      this.logger.log(`Database dump completed. Reading file for S3 upload...`);
      const fileBuffer = fs.readFileSync(tempFilePath);

      this.logger.log(`Uploading database backup to S3/MinIO...`);
      const uploadUrl = await this.s3Service.uploadBuffer(
        fileBuffer,
        tempFileName,
        'application/octet-stream',
        'backups'
      );

      this.logger.log(`Database backup uploaded successfully: ${uploadUrl}`);
      return uploadUrl;
    } catch (error: any) {
      this.logger.error(`Database backup failed: ${error.message}`);
      throw error;
    } finally {
      // Clean up temporary local file
      if (fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
          this.logger.log(`Temporary backup file cleaned up: ${tempFilePath}`);
        } catch (cleanupErr: any) {
          this.logger.warn(`Failed to clean up temporary file: ${cleanupErr.message}`);
        }
      }
    }
  }
}
