import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceRequestStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ServiceRequestsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService
  ) {}

  async create(tenantId: string, data: {
    propertyId: string;
    title: string;
    description: string;
    priority?: string;
    photos?: string[];
  }) {
    const request = await this.prisma.serviceRequest.create({
      data: {
        tenantId,
        propertyId: data.propertyId,
        title: data.title,
        description: data.description,
        priority: data.priority || 'MEDIUM',
        photos: data.photos || [],
      },
      include: {
        tenant: { select: { name: true, email: true } },
        property: { select: { name: true, landlordId: true } }
      }
    });

    // Notify Landlord
    await this.notifications.sendNotification(request.property.landlordId, 
      'New Service Request',
      `${request.tenant.name} has submitted a new ${request.priority} priority request for ${request.property.name}: ${request.title}`,
      'MAINTENANCE',
      `/management/service-requests/${request.id}`
    );

    return request;
  }

  async findByTenant(tenantId: string) {
    return this.prisma.serviceRequest.findMany({
      where: { tenantId },
      include: { property: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findByLandlord(landlordId: string) {
    return this.prisma.serviceRequest.findMany({
      where: { property: { landlordId } },
      include: {
        tenant: { select: { name: true, email: true, phone: true } },
        property: { select: { name: true, address: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const req = await this.prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        tenant: { select: { name: true, email: true, phone: true, id: true } },
        property: { select: { name: true, address: true, landlordId: true } }
      }
    });
    if (!req) throw new NotFoundException('Service request not found');
    return req;
  }

  async updateStatus(id: string, status: ServiceRequestStatus) {
    const data: any = { status };
    if (status === 'RESOLVED') data.resolvedAt = new Date();
    
    const request = await this.prisma.serviceRequest.update({
      where: { id },
      data,
      include: {
        tenant: { select: { id: true, name: true, email: true } },
        property: { select: { name: true } }
      }
    });

    // Notify Tenant
    await this.notifications.sendNotification(request.tenant.id, 
      'Service Request Update',
      `Your request "${request.title}" for ${request.property.name} has been marked as ${status}.`,
      'MAINTENANCE',
      `/residency/maintenance`
    );

    return request;
  }
}
