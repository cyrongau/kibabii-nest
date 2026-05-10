import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TourStatus } from '@prisma/client';

@Injectable()
export class ToursService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async createTourRequest(studentId: string, data: { propertyId: string; tourDate: Date }) {
    const tour = await this.prisma.tour.create({
      data: {
        studentId,
        propertyId: data.propertyId,
        tourDate: data.tourDate,
      },
      include: {
        property: { select: { name: true, landlordId: true } },
        student: { select: { name: true } },
      },
    });

    // Notify Landlord
    await this.notifications.createNotification(tour.property.landlordId, {
      title: 'New Tour Request',
      message: `${tour.student.name} has requested a tour for ${tour.property.name} on ${tour.tourDate.toLocaleDateString()}.`,
      type: 'TOUR',
      link: `/management/tours/${tour.id}`,
    });

    return tour;
  }

  async updateTourStatus(tourId: string, status: TourStatus, feedback?: string) {
    const tour = await this.prisma.tour.update({
      where: { id: tourId },
      data: { status, feedback },
      include: {
        property: { select: { name: true } },
        student: { select: { id: true } },
      },
    });

    // Notify Student
    await this.notifications.createNotification(tour.student.id, {
      title: 'Tour Request Update',
      message: `Your tour request for ${tour.property.name} has been ${status.toLowerCase()}. ${feedback ? `Feedback: ${feedback}` : ''}`,
      type: 'TOUR',
      link: '/tours',
    });

    return tour;
  }

  async getStudentTours(studentId: string) {
    return this.prisma.tour.findMany({
      where: { studentId },
      include: { property: { select: { name: true, address: true, images: true } } },
      orderBy: { tourDate: 'desc' },
    });
  }

  async getLandlordTours(landlordId: string) {
    return this.prisma.tour.findMany({
      where: { property: { landlordId } },
      include: {
        property: { select: { name: true } },
        student: { select: { name: true, email: true, phone: true } },
      },
      orderBy: { tourDate: 'desc' },
    });
  }

  async createOpenDay(landlordId: string, data: { propertyId: string; date: Date; startTime: string; endTime: string; description?: string }) {
    // Verify landlord owns property
    const property = await this.prisma.property.findUnique({ where: { id: data.propertyId } });
    if (!property || property.landlordId !== landlordId) throw new NotFoundException('Property not found');

    const openDay = await this.prisma.openDay.create({
      data: {
        propertyId: data.propertyId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        description: data.description,
      },
    });

    // Notify interested students (those who favorited or previously toured)
    const interestedUsers = await this.prisma.user.findMany({
      where: {
        OR: [
          { favorites: { some: { propertyId: data.propertyId } } },
          { tours: { some: { propertyId: data.propertyId } } },
        ],
      },
      select: { id: true },
    });

    for (const user of interestedUsers) {
      await this.notifications.createNotification(user.id, {
        title: 'New Open Day Scheduled!',
        message: `${property.name} is hosting an open day on ${data.date.toLocaleDateString()} from ${data.startTime} to ${data.endTime}.`,
        type: 'OPEN_DAY',
        link: `/properties/${property.id}`,
      });
    }

    return openDay;
  }

  async getPropertyOpenDays(propertyId: string) {
    return this.prisma.openDay.findMany({
      where: { propertyId },
      orderBy: { date: 'asc' },
    });
  }
}
