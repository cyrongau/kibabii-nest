import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenancyStatus } from '@prisma/client';

@Injectable()
export class TenancyService {
  private readonly logger = new Logger(TenancyService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a tenancy from an approved booking.
   * Landlord can configure financial rules at creation time.
   */
  async createFromBooking(bookingId: string, config: {
    unitName?: string;
    monthlyRent: number;
    depositAmount?: number;
    paymentDeadlineDay?: number;
    latePenaltyPerDay?: number;
    upfrontDiscountPct?: number;
    breakPeriodEnabled?: boolean;
    breakPeriodRentPct?: number;
    breakPeriodStart?: number;
    breakPeriodEnd?: number;
  }) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { propertyUnit: true, student: true }
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== 'APPROVED') throw new BadRequestException('Booking must be approved first');

    // Check if there's already an active tenancy for this student on this unit
    const existing = await this.prisma.tenancy.findFirst({
      where: {
        tenantId: booking.studentId,
        propertyUnitId: booking.propertyUnitId,
        status: { in: ['ACTIVE', 'NOTICE_GIVEN', 'BREAK_HOLD'] }
      }
    });
    if (existing) throw new BadRequestException('Student already has an active tenancy on this unit');

    return this.prisma.tenancy.create({
      data: {
        tenantId: booking.studentId,
        propertyUnitId: booking.propertyUnitId,
        unitName: config.unitName,
        monthlyRent: config.monthlyRent,
        depositAmount: config.depositAmount || 0,
        paymentDeadlineDay: config.paymentDeadlineDay || 5,
        latePenaltyPerDay: config.latePenaltyPerDay || 0,
        upfrontDiscountPct: config.upfrontDiscountPct || 0,
        breakPeriodEnabled: config.breakPeriodEnabled || false,
        breakPeriodRentPct: config.breakPeriodRentPct || 50,
        breakPeriodStart: config.breakPeriodStart || 4,
        breakPeriodEnd: config.breakPeriodEnd || 9,
      },
      include: {
        tenant: { select: { id: true, name: true, email: true, phone: true } },
        propertyUnit: { include: { property: true, type: true } }
      }
    });
  }

  /**
   * File a 30-day vacation notice. 
   * The unit listing immediately shows a countdown.
   */
  async fileVacationNotice(tenancyId: string) {
    const tenancy = await this.prisma.tenancy.findUnique({
      where: { id: tenancyId },
      include: { vacationNotice: true }
    });
    if (!tenancy) throw new NotFoundException('Tenancy not found');
    if (tenancy.status === 'VACATED') throw new BadRequestException('Tenancy is already vacated');
    if (tenancy.vacationNotice) throw new BadRequestException('Vacation notice already filed');

    const noticeDate = new Date();
    const vacationDate = new Date();
    vacationDate.setDate(vacationDate.getDate() + 30);

    const [notice] = await this.prisma.$transaction([
      this.prisma.vacationNotice.create({
        data: {
          tenancyId,
          noticeDate,
          vacationDate,
        }
      }),
      this.prisma.tenancy.update({
        where: { id: tenancyId },
        data: { status: TenancyStatus.NOTICE_GIVEN }
      })
    ]);

    return notice;
  }

  /**
   * Activate break-period hold (reduces rent to configured %).
   */
  async activateBreakHold(tenancyId: string) {
    const tenancy = await this.prisma.tenancy.findUnique({ where: { id: tenancyId } });
    if (!tenancy) throw new NotFoundException('Tenancy not found');
    if (!tenancy.breakPeriodEnabled) throw new BadRequestException('Break period is not enabled for this tenancy');
    if (tenancy.status !== 'ACTIVE') throw new BadRequestException('Only active tenancies can enter break hold');

    return this.prisma.tenancy.update({
      where: { id: tenancyId },
      data: { status: TenancyStatus.BREAK_HOLD }
    });
  }

  /**
   * Deactivate break hold — return to active status.
   */
  async deactivateBreakHold(tenancyId: string) {
    const tenancy = await this.prisma.tenancy.findUnique({ where: { id: tenancyId } });
    if (!tenancy) throw new NotFoundException('Tenancy not found');
    if (tenancy.status !== 'BREAK_HOLD') throw new BadRequestException('Tenancy is not on break hold');

    return this.prisma.tenancy.update({
      where: { id: tenancyId },
      data: { status: TenancyStatus.ACTIVE }
    });
  }

  /**
   * Process vacation — called by scheduler when vacationDate is reached.
   */
  async processVacation(tenancyId: string) {
    await this.prisma.$transaction([
      this.prisma.tenancy.update({
        where: { id: tenancyId },
        data: { status: TenancyStatus.VACATED, moveOutDate: new Date() }
      }),
      this.prisma.vacationNotice.update({
        where: { tenancyId },
        data: { processed: true }
      })
    ]);
    this.logger.log(`Processed vacation for tenancy ${tenancyId}`);
  }

  /**
   * Get all tenancies for a student.
   */
  async findByTenant(tenantId: string) {
    return this.prisma.tenancy.findMany({
      where: { tenantId },
      include: {
        tenant: { select: { id: true, name: true, avatar: true } },
        propertyUnit: { include: { property: true, type: true } },
        vacationNotice: true,
        payments: { orderBy: { dueDate: 'desc' }, take: 20 }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get all tenancies for a landlord's properties.
   */
  async findByLandlord(landlordId: string) {
    return this.prisma.tenancy.findMany({
      where: {
        propertyUnit: { property: { landlordId } }
      },
      include: {
        tenant: { select: { id: true, name: true, email: true, phone: true } },
        propertyUnit: { include: { property: true, type: true } },
        vacationNotice: true,
        payments: { orderBy: { dueDate: 'desc' }, take: 3 }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get a single tenancy with full details.
   */
  async findOne(id: string) {
    const tenancy = await this.prisma.tenancy.findUnique({
      where: { id },
      include: {
        tenant: { select: { id: true, name: true, email: true, phone: true } },
        propertyUnit: { include: { property: true, type: true } },
        vacationNotice: true,
        payments: {
          orderBy: { dueDate: 'desc' },
          include: { receipt: true }
        }
      }
    });
    if (!tenancy) throw new NotFoundException('Tenancy not found');
    return tenancy;
  }

  /**
   * Capture student signature (uploaded signed document).
   */
  async signAgreement(id: string, agreementUrl: string) {
    const tenancy = await this.prisma.tenancy.findUnique({ where: { id } });
    if (!tenancy) throw new NotFoundException('Tenancy not found');

    return this.prisma.tenancy.update({
      where: { id },
      data: {
        agreementUrl,
        signedAt: new Date()
      }
    });
  }

  /**
   * Update tenancy financial configuration (landlord-only).
   */
  async updateConfig(id: string, data: any) {
    return this.prisma.tenancy.update({
      where: { id },
      data: {
        paymentDeadlineDay: data.paymentDeadlineDay,
        latePenaltyPerDay: data.latePenaltyPerDay,
        upfrontDiscountPct: data.upfrontDiscountPct,
        breakPeriodEnabled: data.breakPeriodEnabled,
        breakPeriodRentPct: data.breakPeriodRentPct,
        breakPeriodStart: data.breakPeriodStart,
        breakPeriodEnd: data.breakPeriodEnd,
      }
    });
  }
}
