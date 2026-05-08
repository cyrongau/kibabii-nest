import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminStatsController {
  constructor(private prisma: PrismaService) {}

  @Get('overview')
  async getOverview() {
    const [
      totalUsers,
      totalStudents,
      totalLandlords,
      totalAdmins,
      totalProperties,
      verifiedProperties,
      totalBookings,
      pendingBookings,
      approvedBookings,
      rejectedBookings,
      totalTenancies,
      activeTenancies,
      pendingKyc,
      approvedKyc,
      suspendedUsers,
      totalIdentityDocs,
      totalRevenue,
      pendingProperties,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.prisma.user.count({ where: { role: 'LANDLORD' } }),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.property.count(),
      this.prisma.property.count({ where: { verified: true } }),
      this.prisma.booking.count(),
      this.prisma.booking.count({ where: { status: 'PENDING' } }),
      this.prisma.booking.count({ where: { status: 'APPROVED' } }),
      this.prisma.booking.count({ where: { status: 'REJECTED' } }),
      this.prisma.tenancy.count(),
      this.prisma.tenancy.count({ where: { status: 'ACTIVE' } }),
      this.prisma.landlordKyc.count({ where: { status: 'PENDING' } }),
      this.prisma.landlordKyc.count({ where: { status: 'APPROVED' } }),
      this.prisma.user.count({ where: { isSuspended: true } }),
      this.prisma.studentIdentity.count(),
      this.prisma.booking.aggregate({
        where: { status: 'APPROVED' },
        _sum: { amount: true },
      }),
      this.prisma.property.findMany({
        where: { verified: false },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          landlord: { select: { name: true } },
        },
      }),
    ]);

    return {
      users: { total: totalUsers, students: totalStudents, landlords: totalLandlords, admins: totalAdmins, suspended: suspendedUsers },
      properties: { total: totalProperties, verified: verifiedProperties, unverified: totalProperties - verifiedProperties },
      bookings: { total: totalBookings, pending: pendingBookings, approved: approvedBookings, rejected: rejectedBookings },
      tenancies: { total: totalTenancies, active: activeTenancies },
      kyc: { pending: pendingKyc, approved: approvedKyc },
      identity: { total: totalIdentityDocs },
      revenue: { total: totalRevenue._sum.amount || 0 },
      pendingApprovals: pendingProperties,
    };
  }

  @Get('growth')
  async getGrowthStats() {
    // Get user signups grouped by month for the last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const users = await this.prisma.user.findMany({
      where: { createdAt: { gte: twelveMonthsAgo } },
      select: { createdAt: true, role: true },
      orderBy: { createdAt: 'asc' },
    });

    const bookings = await this.prisma.booking.findMany({
      where: { createdAt: { gte: twelveMonthsAgo } },
      select: { createdAt: true, status: true, amount: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by month
    const monthlyUsers: Record<string, { students: number; landlords: number; total: number }> = {};
    const monthlyBookings: Record<string, { total: number; approved: number; revenue: number }> = {};

    for (const user of users) {
      const key = `${user.createdAt.getFullYear()}-${String(user.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyUsers[key]) monthlyUsers[key] = { students: 0, landlords: 0, total: 0 };
      monthlyUsers[key].total++;
      if (user.role === 'STUDENT') monthlyUsers[key].students++;
      if (user.role === 'LANDLORD') monthlyUsers[key].landlords++;
    }

    for (const booking of bookings) {
      const key = `${booking.createdAt.getFullYear()}-${String(booking.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyBookings[key]) monthlyBookings[key] = { total: 0, approved: 0, revenue: 0 };
      monthlyBookings[key].total++;
      if (booking.status === 'APPROVED') {
        monthlyBookings[key].approved++;
        monthlyBookings[key].revenue += (booking.amount || 0);
      }
    }

    // Recent signups (last 10)
    const recentUsers = await this.prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    // Top properties by bookings
    const topProperties = await this.prisma.property.findMany({
      take: 5,
      include: {
        _count: { select: { units: true } },
        landlord: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      monthlyUsers,
      monthlyBookings,
      recentUsers,
      topProperties,
    };
  }
}
