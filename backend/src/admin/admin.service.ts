import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      newBookings,
      approvedBookings,
      totalPayments,
      pendingKyc
    ] = await Promise.all([
      this.prisma.booking.count({
        where: { createdAt: { gte: today } }
      }),
      this.prisma.booking.count({
        where: { status: 'APPROVED' }
      }),
      this.prisma.payment.aggregate({
        _sum: { amountPaid: true }
      }),
      this.prisma.user.count({
        where: { 
          role: 'LANDLORD',
          kyc: { status: 'PENDING' }
        }
      })
    ]);

    return {
      newBookings,
      approvedBookings,
      totalPayments: totalPayments._sum.amountPaid || 0,
      pendingKyc
    };
  }

  async getPendingMarketplaceItems() {
    return this.prisma.marketplaceItem.findMany({
      where: { status: 'PENDING' },
      include: { seller: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async reviewMarketplaceItem(id: string, status: 'APPROVED' | 'REJECTED', rejectionReason?: string) {
    return this.prisma.marketplaceItem.update({
      where: { id },
      data: { 
        status,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null
      }
    });
  }
}
