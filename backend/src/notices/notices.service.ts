import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NoticesService {
  constructor(private prisma: PrismaService) {}

  async createPropertyNotice(propertyId: string, landlordId: string, data: { title: string, content: string, type: string, expiresAt?: string }) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, landlordId },
    });

    if (!property) throw new NotFoundException('Property not found or access denied');

    const notice = await this.prisma.propertyNotice.create({
      data: {
        propertyId,
        title: data.title,
        content: data.content,
        type: data.type || 'GENERAL',
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });

    // Notify all active tenants
    const tenancies = await this.prisma.tenancy.findMany({
      where: {
        propertyUnit: { propertyId },
        status: 'ACTIVE',
      },
      select: { tenantId: true },
    });

    const tenantIds = [...new Set(tenancies.map(t => t.tenantId))].filter(id => id !== landlordId);

    await this.prisma.notification.createMany({
      data: tenantIds.map(userId => ({
        userId,
        title: `New Notice: ${data.title}`,
        message: data.content.substring(0, 100) + (data.content.length > 100 ? '...' : ''),
        type: 'tenancy',
        link: '/dashboard/student/tenancy',
      })),
    });

    return notice;
  }

  async createGeneralNotice(adminId: string, data: { title: string, content: string, type: string, expiresAt?: string }) {
    const notice = await this.prisma.propertyNotice.create({
      data: {
        propertyId: null,
        title: data.title,
        content: data.content,
        type: data.type || 'GENERAL',
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });

    // Notify ALL active students (General community broadcast)
    const students = await this.prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: { id: true },
    });

    await this.prisma.notification.createMany({
      data: students.map(u => ({
        userId: u.id,
        title: `Kibabii Nest Update: ${data.title}`,
        message: data.content.substring(0, 100) + (data.content.length > 100 ? '...' : ''),
        type: 'community',
        link: '/community',
      })),
    });

    return notice;
  }

  async getPropertyNotices(propertyId: string) {
    const now = new Date();
    return this.prisma.propertyNotice.findMany({
      where: { 
        propertyId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } }
        ]
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyNotices(tenantId: string) {
    const now = new Date();
    const activeTenancies = await this.prisma.tenancy.findMany({
      where: { tenantId, status: 'ACTIVE' },
      select: { propertyUnit: { select: { propertyId: true } } },
    });

    const propertyIds = activeTenancies.map(t => t.propertyUnit.propertyId);

    return this.prisma.propertyNotice.findMany({
      where: { 
        propertyId: { in: propertyIds },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } }
        ]
      },
      include: { property: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getGeneralNotices() {
    const now = new Date();
    return this.prisma.propertyNotice.findMany({
      where: { 
        propertyId: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async deleteNotice(noticeId: string, landlordId: string) {
    const notice = await this.prisma.propertyNotice.findFirst({
      where: { id: noticeId, property: { landlordId } },
    });

    if (!notice) throw new NotFoundException('Notice not found or access denied');

    return this.prisma.propertyNotice.delete({ where: { id: noticeId } });
  }
}
