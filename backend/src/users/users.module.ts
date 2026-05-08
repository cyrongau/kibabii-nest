import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { StudentIdentityService } from './student-identity.service';
import { AdminStatsController } from './admin-stats.controller';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [UploadsModule],
  providers: [UsersService, StudentIdentityService],
  controllers: [UsersController, AdminStatsController],
  exports: [UsersService],
})
export class UsersModule {}
