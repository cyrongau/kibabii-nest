import { Test, TestingModule } from '@nestjs/testing';
import { BackupService } from './backup.service';
import { S3Service } from '../uploads/s3.service';
import { exec } from 'child_process';
import * as fs from 'fs';

jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

describe('BackupService', () => {
  let service: BackupService;
  let s3Service: S3Service;

  const mockS3Service = {
    uploadBuffer: jest.fn().mockResolvedValue('https://s3.url/backups/backup.dump'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackupService,
        { provide: S3Service, useValue: mockS3Service },
      ],
    }).compile();

    service = module.get<BackupService>(BackupService);
    s3Service = module.get<S3Service>(S3Service);

    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('runBackup', () => {
    it('should successfully run pg_dump, upload to S3, and delete local file', async () => {
      // Mock exec to succeed immediately
      (exec as unknown as jest.Mock).mockImplementation((cmd, cb) => {
        cb(null, { stdout: 'done', stderr: '' });
      });

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('backup-data'));

      const result = await service.runBackup();

      expect(exec).toHaveBeenCalledWith(
        expect.stringContaining('pg_dump -d "postgresql://user:pass@localhost:5432/db" -F c -b -f'),
        expect.any(Function),
      );
      expect(s3Service.uploadBuffer).toHaveBeenCalledWith(
        Buffer.from('backup-data'),
        expect.stringContaining('db-backup-'),
        'application/octet-stream',
        'backups',
      );
      expect(fs.unlinkSync).toHaveBeenCalled();
      expect(result).toBe('https://s3.url/backups/backup.dump');
    });

    it('should clean up the local file even if S3 upload fails', async () => {
      (exec as unknown as jest.Mock).mockImplementation((cmd, cb) => {
        cb(null, { stdout: 'done', stderr: '' });
      });

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('backup-data'));
      mockS3Service.uploadBuffer.mockRejectedValue(new Error('S3 error'));

      await expect(service.runBackup()).rejects.toThrow('S3 error');

      expect(fs.unlinkSync).toHaveBeenCalled();
    });
  });
});
