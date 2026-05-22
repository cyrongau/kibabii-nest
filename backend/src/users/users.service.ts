import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: { role?: string; search?: string; page?: number; limit?: number } = {}) {
    const { role, search, page = 1, limit = 50 } = filters;

    const where: any = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          avatar: true,
          isVerifiedLandlord: true,
          isSuspended: true,
          createdAt: true,
          _count: {
            select: {
              properties: true,
              bookings: true,
            }
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOneById(id: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          avatar: true,
          isVerifiedLandlord: true,
          isSuspended: true,
          createdAt: true,
          updatedAt: true,
          studentIdentity: true,
          kyc: true,
          _count: {
            select: {
              properties: true,
              bookings: true,
              reviews: true,
            }
          },
        },
      });
      if (!user) throw new NotFoundException('User not found');
      return user;
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to fetch user details');
    }
  }

  async getStats() {
    const [total, students, landlords, admins, suspended, recentWeek] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.prisma.user.count({ where: { role: 'LANDLORD' } }),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.user.count({ where: { isSuspended: true } }),
      this.prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    ]);

    return { total, students, landlords, admins, suspended, recentWeek };
  }

  async updateRole(id: string, role: any) {
    return this.prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  async suspend(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isSuspended: true },
      select: { id: true, name: true, email: true, isSuspended: true },
    });
  }

  async activate(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isSuspended: false },
      select: { id: true, name: true, email: true, isSuspended: true },
    });
  }

  async update(id: string, data: any) {
    if (data.password) {
      const bcrypt = require('bcrypt');
      data.password = await bcrypt.hash(data.password, 10);
    }
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }

  async verifyLandlord(id: string, verified: boolean) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: { isVerifiedLandlord: verified },
        select: { id: true, name: true, email: true, isVerifiedLandlord: true },
      });

      // Synchronize with LandlordKyc if it exists
      const kyc = await tx.landlordKyc.findUnique({ where: { userId: id } });
      if (kyc) {
        await tx.landlordKyc.update({
          where: { id: kyc.id },
          data: { status: verified ? 'APPROVED' : 'REJECTED' }
        });
      } else if (verified) {
        // If verified manually but no KYC record, create a dummy one to show up in the lists if needed
        // but it's better to just fetch users in the KYC list.
        // For now, let's just create one so they show up in the "APPROVED" tab of the KYC page.
        await tx.landlordKyc.create({
          data: {
            userId: id,
            idDocumentUrl: '',
            ownershipProofUrl: '',
            status: 'APPROVED',
            aiAnalysis: { note: 'Manually verified via admin terminal' }
          }
        });
      }

      return user;
    });
  }

  async creditBalance(userId: string, amount: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { balance: { increment: amount } }
    });
  }

  async debitBalance(userId: string, amount: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { balance: { decrement: amount } }
    });
  }
}
