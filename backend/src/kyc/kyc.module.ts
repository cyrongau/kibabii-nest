import { Module } from '@nestjs/common';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [PrismaModule, NotificationsModule, UploadsModule],
  controllers: [KycController],
  providers: [KycService],
})
export class KycModule {}
