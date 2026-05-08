import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(studentId: string, data: any) {
    const { propertyId, rating, comment } = data;

    // Check if student has a tenancy or booking for this property
    const hasHistory = await this.prisma.booking.findFirst({
      where: {
        studentId,
        propertyUnit: { propertyId },
        status: 'APPROVED',
      },
    });

    if (!hasHistory) {
      throw new BadRequestException('Only students who have booked this property can leave reviews.');
    }

    return this.prisma.review.create({
      data: {
        studentId,
        propertyId,
        rating: Number(rating),
        comment,
      },
      include: { student: { select: { name: true, avatar: true } } },
    });
  }

  async getPropertyReviews(propertyId: string) {
    return this.prisma.review.findMany({
      where: { propertyId },
      include: { student: { select: { name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
