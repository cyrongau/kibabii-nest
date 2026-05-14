import { Module } from '@nestjs/common';
import { TenancyService } from './tenancy.service';
import { TenancyController } from './tenancy.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PdfService } from './pdf.service';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [PrismaModule, UploadsModule],
  providers: [TenancyService, PdfService],
  controllers: [TenancyController],
  exports: [TenancyService],
})
export class TenancyModule {}
