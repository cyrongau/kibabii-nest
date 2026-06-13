import { Module, forwardRef } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UploadsModule } from '../uploads/uploads.module';
import { TenancyModule } from '../tenancy/tenancy.module';

@Module({
  imports: [PrismaModule, forwardRef(() => NotificationsModule), UploadsModule, TenancyModule],
  providers: [PaymentsService],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
