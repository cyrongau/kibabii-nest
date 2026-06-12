import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { BackupService } from './backup.service';
import { UploadsModule } from '../uploads/uploads.module';

@Global()
@Module({
  imports: [UploadsModule],
  providers: [PrismaService, BackupService],
  exports: [PrismaService, BackupService],
})
export class PrismaModule {}
