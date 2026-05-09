import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService
  ) {}

  async create(studentId: string, data: any) {
    const { propertyUnitId, amount, months = 1 } = data;

    const propertyUnit = await this.prisma.propertyUnit.findUnique({ 
      where: { id: propertyUnitId },
      include: { property: true, type: true }
    });
    if (!propertyUnit) throw new NotFoundException('Property Unit not found');
    
    // Check capacity: Active Tenancies + Pending Bookings
    const activeTenancies = await this.prisma.tenancy.count({
      where: {
        propertyUnitId,
        status: { in: ['ACTIVE', 'NOTICE_GIVEN', 'BREAK_HOLD'] }
      }
    });

    const pendingBookings = await this.prisma.booking.count({
      where: {
        propertyUnitId,
        status: 'PENDING'
      }
    });

    if (activeTenancies + pendingBookings >= propertyUnit.totalUnits) {
      throw new BadRequestException(`This ${propertyUnit.type?.name || 'unit'} is currently full (Capacity: ${propertyUnit.totalUnits}). Please try another unit type or property.`);
    }

    const booking = await this.prisma.booking.create({
      data: {
        studentId,
        propertyUnitId,
        amount,
        months,
        status: BookingStatus.PENDING,
      },
      include: { 
        propertyUnit: { include: { property: true, type: true } },
        student: { select: { name: true } }
      },
    });

    // Notify Landlord
    try {
      const landlordId = propertyUnit.property.landlordId;
      await this.notifications.sendNotification(
        landlordId,
        'New Booking Request',
        `${booking.student.name} has requested to book ${propertyUnit.property.name} (${propertyUnit.type?.name || 'Unit'}) for ${months} month(s).`,
        'BOOKING',
        `/dashboard/landlord/bookings/${booking.id}`
      );
    } catch (e) {
      console.error('Failed to send landlord notification:', e);
    }

    return booking;
  }

  async findMyBookings(studentId: string) {
    return this.prisma.booking.findMany({
      where: { studentId },
      include: { propertyUnit: { include: { property: true, type: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findLandlordBookings(landlordId: string) {
    return this.prisma.booking.findMany({
      where: {
        propertyUnit: {
          property: { landlordId }
        },
      },
      include: { 
        propertyUnit: { include: { property: true, type: true } }, 
        student: true 
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { propertyUnit: { include: { property: true, type: true } }, student: { select: { name: true, email: true, phone: true } } },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async updateStatus(id: string, status: BookingStatus, unitName?: string) {
    // 1. Fetch booking with property/landlord details first
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { 
        propertyUnit: { include: { property: true, type: true } }, 
        student: { select: { id: true, name: true } } 
      }
    });

    if (!booking) throw new NotFoundException('Booking not found');

    // 2. Perform all updates in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Re-verify capacity before approving
      if (status === BookingStatus.APPROVED) {
        const activeTenancies = await tx.tenancy.count({
          where: {
            propertyUnitId: booking.propertyUnitId,
            status: { in: ['ACTIVE', 'NOTICE_GIVEN', 'BREAK_HOLD'] }
          }
        });

        if (activeTenancies >= booking.propertyUnit.totalUnits) {
          throw new BadRequestException('Cannot approve booking: Unit type is full.');
        }
      }

      // Update booking status
      const updatedBooking = await tx.booking.update({
        where: { id },
        data: { status },
      });

      if (status === BookingStatus.APPROVED) {
        // Create Tenancy
        const tenancy = await tx.tenancy.create({
          data: {
            tenantId: booking.studentId,
            propertyUnitId: booking.propertyUnitId,
            unitName: unitName,
            monthlyRent: booking.propertyUnit.price,
            depositAmount: 0,
            status: 'ACTIVE',
          }
        });

        // Create initial payment records for the advance months
        const now = new Date();
        const currentDay = now.getDate();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        
        let startMonth = now.getMonth() + 1;
        let startYear = now.getFullYear();
        let monthsToPay = booking.months || 1;

        // Pro-rating logic: If within 7 days of month-end, the "current" month is pro-rated 
        // and we effectively start from the next month for the full payments.
        // For this implementation, we'll just shift the starting target month if near end.
        if ((daysInMonth - currentDay) <= 7) {
          startMonth += 1;
          if (startMonth > 12) {
            startMonth = 1;
            startYear += 1;
          }
        }
        
        for (let i = 0; i < monthsToPay; i++) {
          let targetMonth = startMonth + i;
          let targetYear = startYear;
          
          while (targetMonth > 12) {
            targetMonth -= 12;
            targetYear += 1;
          }

          const amountForMonth = booking.propertyUnit.price;

          await tx.payment.create({
            data: {
              tenancyId: tenancy.id,
              month: targetMonth,
              year: targetYear,
              amountDue: amountForMonth,
              amountPaid: amountForMonth,
              status: 'VERIFIED',
              paidDate: now,
              dueDate: new Date(targetYear, targetMonth - 1, 5),
            }
          });
        }

        // Update Landlord Balance
        await tx.user.update({
          where: { id: booking.propertyUnit.property.landlordId },
          data: { balance: { increment: booking.amount } }
        });

        // Return updated booking with same structure as before
        return { ...updatedBooking, tenancyId: tenancy.id };
      }

      return updatedBooking;
    });

    // 3. Send notifications AFTER successful transaction
    if (status === BookingStatus.APPROVED) {
      try {
        await this.notifications.sendNotification(
          booking.studentId,
          'Booking Approved!',
          `Your booking for ${booking.propertyUnit.property.name} has been approved. You are assigned to unit: ${unitName || 'Pending'}.`,
          'BOOKING',
          '/dashboard/student'
        );
      } catch (e) {
        console.warn('Failed to send approval notification:', e);
      }
    }

    return result;
  }

  async findAllAdmin(filters: { status?: string; search?: string; page?: number; limit?: number } = {}) {
    const { status, search, page = 1, limit = 50 } = filters;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { student: { name: { contains: search, mode: 'insensitive' } } },
        { student: { email: { contains: search, mode: 'insensitive' } } },
        { propertyUnit: { property: { name: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, email: true, phone: true } },
          propertyUnit: {
            include: {
              property: { select: { id: true, name: true, address: true, landlord: { select: { name: true } } } },
              type: true,
            }
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return { bookings, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getAdminStats() {
    const [total, pending, approved, rejected, cancelled] = await Promise.all([
      this.prisma.booking.count(),
      this.prisma.booking.count({ where: { status: 'PENDING' } }),
      this.prisma.booking.count({ where: { status: 'APPROVED' } }),
      this.prisma.booking.count({ where: { status: 'REJECTED' } }),
      this.prisma.booking.count({ where: { status: 'CANCELLED' } }),
    ]);

    return { total, pending, approved, rejected, cancelled };
  }
}
