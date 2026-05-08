import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  // --- Student Profile ---
  async updateStudentProfile(userId: string, data: { faculty?: string; yearOfStudy?: number; hobbies?: string; bio?: string }) {
    const student = await this.prisma.studentIdentity.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        documentUrl: '', // Will be updated during KYC/scan
        ...data,
      },
    });
    return student;
  }

  async getStudentProfile(userId: string) {
    return this.prisma.studentIdentity.findUnique({
      where: { userId },
    });
  }

  // --- Student Matching ---
  async findMatches(userId: string) {
    const myProfile = await this.prisma.studentIdentity.findUnique({
      where: { userId },
    });

    if (!myProfile || !myProfile.faculty) {
      // Fallback or empty if profile not set
      return this.prisma.studentIdentity.findMany({
        where: { NOT: { userId } },
        include: { user: { select: { id: true, name: true, avatar: true } } },
        take: 5,
      });
    }

    return this.prisma.studentIdentity.findMany({
      where: {
        NOT: { userId },
        OR: [
          { faculty: myProfile.faculty },
          { hobbies: { contains: myProfile.hobbies?.split(',')[0] } },
        ],
      },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      take: 10,
    });
  }

  // --- Testimonials ---
  async submitTestimonial(userId: string, data: { content: string; rating?: number }) {
    return this.prisma.testimonial.create({
      data: {
        userId,
        content: data.content,
        rating: data.rating || 5,
        status: 'PENDING',
      },
    });
  }

  async getFeaturedTestimonials() {
    return this.prisma.testimonial.findMany({
      where: { isFeatured: true, status: 'APPROVED' },
      include: { 
        user: { 
          select: { 
            name: true, 
            avatar: true,
            studentIdentity: { select: { faculty: true, yearOfStudy: true } }
          } 
        } 
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  }

  async getAllApprovedTestimonials() {
    return this.prisma.testimonial.findMany({
      where: { status: 'APPROVED' },
      include: { 
        user: { 
          select: { 
            name: true, 
            avatar: true,
            studentIdentity: { select: { faculty: true, yearOfStudy: true } }
          } 
        } 
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  async getAllTestimonials(status?: string) {
    return this.prisma.testimonial.findMany({
      where: status ? { status } : {},
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async moderateTestimonial(id: string, status: string, isFeatured: boolean) {
    return this.prisma.testimonial.update({
      where: { id },
      data: { status, isFeatured },
    });
  }

  // --- Study Buddies ---
  async createStudyPost(userId: string, data: { title: string; content: string; faculty?: string; tags?: string[] }) {
    return this.prisma.studyBuddyPost.create({
      data: {
        authorId: userId,
        ...data,
      },
    });
  }

  async getStudyPosts(faculty?: string) {
    return this.prisma.studyBuddyPost.findMany({
      where: faculty ? { faculty } : {},
      include: {
        author: { select: { name: true, avatar: true } },
        _count: { select: { replies: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStudyPostDetails(id: string) {
    return this.prisma.studyBuddyPost.findUnique({
      where: { id },
      include: {
        author: { select: { name: true, avatar: true } },
        replies: {
          include: { author: { select: { name: true, avatar: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async addReply(userId: string, postId: string, content: string) {
    return this.prisma.studyBuddyReply.create({
      data: {
        authorId: userId,
        postId,
        content,
      },
    });
  }
}
