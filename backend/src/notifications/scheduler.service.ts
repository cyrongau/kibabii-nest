import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { MailService } from './mail.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
    private mailService: MailService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * MONTHLY 1st at 00:05 — Generate payment records for active tenancies.
   */
  @Cron('5 0 1 * *')
  async handleMonthlyPaymentGeneration() {
    this.logger.log('⏰ Cron: Generating monthly payment records...');
    try {
      const result = await this.paymentsService.generateMonthlyPayments();
      this.logger.log(`✅ Generated ${result.created} payments for ${result.month}/${result.year}`);
    } catch (error: any) {
      this.logger.error('❌ Monthly payment generation failed:', error.message);
    }
  }

  /**
   * DAILY at 08:00 — Payment reminders (3 days before due date).
   */
  @Cron('0 8 * * *')
  async handlePaymentReminders() {
    this.logger.log('⏰ Cron: Checking for upcoming payment reminders...');
    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      threeDaysFromNow.setHours(23, 59, 59, 999);

      const upcomingPayments = await this.prisma.payment.findMany({
        where: {
          status: 'PENDING',
          dueDate: { gte: today, lte: threeDaysFromNow }
        },
        include: {
          tenancy: {
            include: {
              tenant: true,
              propertyUnit: { include: { property: true, type: true } }
            }
          }
        }
      });

      for (const payment of upcomingPayments) {
        if (!payment.tenancy || !payment.dueDate) continue;
        const tenant = payment.tenancy.tenant;
        const property = payment.tenancy.propertyUnit.property;
        const daysUntilDue = Math.ceil((payment.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

        // Send email reminder
        await this.mailService.sendNotificationEmail(
          tenant.email,
          'Payment Reminder',
          `Your rent payment of <strong>Ksh ${payment.amountDue.toLocaleString()}</strong> for <strong>${property.name}</strong> is due in <strong>${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}</strong>.`,
          'Please make your payment before the deadline to avoid late penalties.',
          'Make Payment'
        );

        // In-app notification
        await this.notificationsService.sendNotification(
          tenant.id,
          'Payment Reminder',
          `Your rent of Ksh ${payment.amountDue.toLocaleString()} is due in ${daysUntilDue} days.`,
          'payment'
        );
      }

      this.logger.log(`✅ Sent ${upcomingPayments.length} payment reminders`);
    } catch (error: any) {
      this.logger.error('❌ Payment reminder cron failed:', error.message);
    }
  }

  /**
   * DAILY at 08:30 — Detect overdue payments and calculate penalties.
   */
  @Cron('30 8 * * *')
  async handleOverdueDetection() {
    this.logger.log('⏰ Cron: Processing overdue payments...');
    try {
      const result = await this.paymentsService.processOverduePayments();
      
      // Send overdue notifications
      const overduePayments = await this.prisma.payment.findMany({
        where: { status: 'OVERDUE' },
        include: {
          tenancy: {
            include: {
              tenant: true,
              propertyUnit: { include: { property: true } }
            }
          }
        }
      });

      for (const payment of overduePayments) {
        if (!payment.tenancy || !payment.dueDate) continue;
        const tenant = payment.tenancy.tenant;
        const property = payment.tenancy.propertyUnit.property;
        const daysLate = Math.floor((new Date().getTime() - payment.dueDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysLate === 1 || daysLate % 7 === 0) { // Notify on day 1 and weekly after
          await this.mailService.sendNotificationEmail(
            tenant.email,
            '⚠️ Payment Overdue',
            `Your rent payment of <strong>Ksh ${payment.amountDue.toLocaleString()}</strong> for <strong>${property.name}</strong> is <strong>${daysLate} day${daysLate !== 1 ? 's' : ''} overdue</strong>.`,
            payment.penaltyAmount > 0
              ? `A late penalty of <strong>Ksh ${payment.penaltyAmount.toLocaleString()}</strong> has been applied. Total due: <strong>Ksh ${(payment.amountDue + payment.penaltyAmount).toLocaleString()}</strong>.`
              : 'Please make your payment immediately.',
            'Pay Now'
          );
        }
      }

      this.logger.log(`✅ Processed ${result.processed} overdue payments`);
    } catch (error: any) {
      this.logger.error('❌ Overdue detection cron failed:', error.message);
    }
  }

  /**
   * DAILY at 00:00 — Process vacation notices that have reached their date.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleVacationProcessing() {
    this.logger.log('⏰ Cron: Processing vacation notices...');
    try {
      const now = new Date();
      const dueNotices = await this.prisma.vacationNotice.findMany({
        where: {
          processed: false,
          vacationDate: { lte: now }
        },
        include: {
          tenancy: {
            include: {
              tenant: true,
              propertyUnit: { include: { property: true } }
            }
          }
        }
      });

      for (const notice of dueNotices) {
        // Mark tenancy as vacated
        await this.prisma.$transaction([
          this.prisma.tenancy.update({
            where: { id: notice.tenancyId },
            data: { status: 'VACATED', moveOutDate: now }
          }),
          this.prisma.vacationNotice.update({
            where: { id: notice.id },
            data: { processed: true }
          })
        ]);

        const tenant = notice.tenancy.tenant;
        const property = notice.tenancy.propertyUnit.property;

        // Notify tenant
        await this.mailService.sendNotificationEmail(
          tenant.email,
          'Tenancy Ended',
          `Your tenancy at <strong>${property.name}</strong> has officially ended as per your 30-day vacation notice.`,
          'We wish you all the best in your next accommodation. Thank you for being part of the Kibabii Nest community!',
          'View Details'
        );

        // Notify landlord
        const landlord = await this.prisma.user.findUnique({ where: { id: property.landlordId } });
        if (landlord) {
          await this.mailService.sendNotificationEmail(
            landlord.email,
            'Tenant Vacated',
            `<strong>${tenant.name}</strong> has vacated their unit at <strong>${property.name}</strong>.`,
            'The unit is now available for new bookings and will appear in live listings.',
            'View Property'
          );
        }
      }

      this.logger.log(`✅ Processed ${dueNotices.length} vacation notices`);
    } catch (error: any) {
      this.logger.error('❌ Vacation processing cron failed:', error.message);
    }
  }

  /**
   * DAILY at 09:00 — Remind admin about properties pending approval > 3 days.
   */
  @Cron('0 9 * * *')
  async handlePendingPropertyReminders() {
    this.logger.log('⏰ Cron: Checking for stale pending properties...');
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const staleProperties = await this.prisma.property.findMany({
        where: {
          verified: false,
          createdAt: { lte: threeDaysAgo }
        },
        include: { landlord: { select: { name: true } } }
      });

      if (staleProperties.length > 0) {
        // Find all admins
        const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN' } });

        for (const admin of admins) {
          const propertyList = staleProperties.map(p =>
            `• <strong>${p.name}</strong> by ${p.landlord.name} (submitted ${p.createdAt.toLocaleDateString()})`
          ).join('<br/>');

          await this.mailService.sendNotificationEmail(
            admin.email,
            `🔔 ${staleProperties.length} Properties Pending Approval`,
            `The following properties have been waiting for approval for more than 3 days:`,
            propertyList,
            'Review Properties'
          );

          await this.notificationsService.sendNotification(
            admin.id,
            'Properties Pending Approval',
            `${staleProperties.length} properties have been pending for over 3 days`,
            'system'
          );
        }
      }

      this.logger.log(`✅ Found ${staleProperties.length} stale pending properties`);
    } catch (error: any) {
      this.logger.error('❌ Pending property reminder cron failed:', error.message);
    }
  }
}
