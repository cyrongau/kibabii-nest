import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PropertiesModule } from './properties/properties.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { UsersModule } from './users/users.module';
import { MessagesModule } from './messages/messages.module';
import { UploadsModule } from './uploads/uploads.module';
import { ContractsModule } from './contracts/contracts.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TaxonomyModule } from './taxonomy/taxonomy.module';
import { TenancyModule } from './tenancy/tenancy.module';
import { ServiceRequestsModule } from './service-requests/service-requests.module';
import { KycModule } from './kyc/kyc.module';
import { NoticesModule } from './notices/notices.module';
import { FavoritesModule } from './favorites/favorites.module';
import { ReviewsModule } from './reviews/reviews.module';
import { CommunityModule } from './community/community.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { SupportModule } from './support/support.module';
import { AdminModule } from './admin/admin.module';
import { WalletModule } from './wallet/wallet.module';
import { ToursModule } from './tours/tours.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule, 
    AuthModule, 
    PropertiesModule, 
    BookingsModule,
    PaymentsModule,
    UsersModule,
    MessagesModule,
    UploadsModule,
    AdminModule,
    WalletModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ContractsModule,
    NotificationsModule,
    TaxonomyModule,
    TenancyModule,
    ServiceRequestsModule,
    KycModule,
    NoticesModule,
    FavoritesModule,
    ReviewsModule,
    CommunityModule,
    MarketplaceModule,
    SupportModule,
    ToursModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
