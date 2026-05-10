import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MarketplaceService {
  constructor(private prisma: PrismaService) {}

  async createItem(userId: string, data: { title: string; description: string; price: number; images: string[]; category?: string; phone?: string }) {
    // Basic AI moderation check (keyword-based)
    const prohibitedKeywords = ['alcohol', 'sex', 'drugs', 'stolen', 'illegal', 'beer', 'whiskey', 'weed'];
    const content = `${data.title} ${data.description}`.toLowerCase();
    
    const isProhibited = prohibitedKeywords.some(kw => content.includes(kw));
    
    return this.prisma.marketplaceItem.create({
      data: {
        sellerId: userId,
        ...data,
        status: isProhibited ? 'REJECTED' : 'PENDING',
        rejectionReason: isProhibited ? 'Content contains prohibited keywords or items.' : null
      },
    });
  }

  async getAllItems(category?: string, search?: string) {
    const where: any = { isSold: false, status: 'APPROVED' };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.marketplaceItem.findMany({
      where,
      include: { seller: { select: { name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyItems(userId: string) {
    return this.prisma.marketplaceItem.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getItemDetails(id: string) {
    const item = await this.prisma.marketplaceItem.findUnique({
      where: { id },
      include: { seller: { select: { name: true, avatar: true, phone: true } } },
    });
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  async markAsSold(userId: string, id: string) {
    const item = await this.prisma.marketplaceItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item not found');
    if (item.sellerId !== userId) throw new Error('Not authorized to sell this item');

    return this.prisma.marketplaceItem.update({
      where: { id },
      data: { isSold: !item.isSold },
    });
  }

  async deleteItem(userId: string, id: string) {
    const item = await this.prisma.marketplaceItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item not found');
    if (item.sellerId !== userId) throw new Error('Not authorized to delete this item');

    return this.prisma.marketplaceItem.delete({ where: { id } });
  }

  async updateItem(userId: string, id: string, data: any) {
    const item = await this.prisma.marketplaceItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item not found');
    if (item.sellerId !== userId) {
      throw new Error('Not authorized to update this item');
    }

    return this.prisma.marketplaceItem.update({
      where: { id },
      data,
    });
  }

  async findAllAdmin(filters: { status?: string; search?: string; page?: any; limit?: any; sellerId?: string } = {}) {
    const page = filters.page ? parseInt(filters.page.toString()) : 1;
    const limit = filters.limit ? parseInt(filters.limit.toString()) : 25;
    const { status, search, sellerId } = filters;

    const where: any = {};
    if (status) where.status = status;
    if (sellerId) where.sellerId = sellerId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { seller: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.marketplaceItem.findMany({
        where,
        include: { 
          seller: { 
            select: { 
              id: true, 
              name: true, 
              email: true, 
              phone: true, 
              avatar: true,
              createdAt: true,
              isVerifiedLandlord: true,
              _count: { select: { marketplaceItems: true } }
            } 
          } 
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.marketplaceItem.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateStatus(id: string, status: any, rejectionReason?: string) {
    return this.prisma.marketplaceItem.update({
      where: { id },
      data: { status, rejectionReason },
    });
  }
}
